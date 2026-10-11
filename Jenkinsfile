pipeline {
  agent any

  environment {
    AWS_REGION   = 'ap-south-1'
    ECR_REGISTRY = '869935092639.dkr.ecr.ap-south-1.amazonaws.com'
    ECR_REPO     = 'system-design-studio'
    // Private IP, not the Elastic IP: apps-sg allows SSH from jenkins-sg,
    // and a security-group reference only matches private-IP traffic.
    APP_HOST     = 'ec2-user@172.31.2.45'
    PUBLIC_URL   = 'https://kishor-apps.duckdns.org'
    APP_DIR      = '/opt/apps/sds'
    DEPLOY_KEY   = '/var/lib/jenkins/.ssh/deploy_key'
    // Prisma Client needs a syntactically valid URL to construct, but the
    // unit tests never connect to a database (same placeholder as ci.yml).
    DATABASE_URL = 'postgresql://user:pass@localhost:5432/ci'
  }

  options {
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds() // two deploys racing on one DB is a bad afternoon
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.IMAGE_TAG = sh(script: 'git rev-parse --short=7 HEAD', returnStdout: true).trim()
        }
        echo "Building commit ${env.IMAGE_TAG}"
      }
    }

    stage('Install')   { steps { sh 'npm ci' } }        // ci, not install: reproducible
    stage('Lint')      { steps { sh 'npm run lint' } }
    stage('Typecheck') { steps { sh 'npm run typecheck' } }
    stage('Test')      { steps { sh 'npm run test' } }

    stage('Build image') {
      steps {
        sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ."
      }
    }

    stage('Push to ECR') {
      when { expression { env.GIT_BRANCH in ['origin/master', 'master'] } }
      steps {
        sh """
          aws ecr get-login-password --region ${AWS_REGION} \
            | docker login --username AWS --password-stdin ${ECR_REGISTRY}
          docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
          docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPO}:latest
          docker push ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
          docker push ${ECR_REGISTRY}/${ECR_REPO}:latest
        """
      }
    }

    stage('Deploy') {
      when { expression { env.GIT_BRANCH in ['origin/master', 'master'] } }
      steps {
        // The deploy key lives at /var/lib/jenkins/.ssh/deploy_key (mode 600,
        // owned by jenkins), so no private key is stored in the Jenkins UI.
        sh """
          ssh -i ${DEPLOY_KEY} -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${APP_HOST} '
            set -e
            aws ecr get-login-password --region ${AWS_REGION} \
              | docker login --username AWS --password-stdin ${ECR_REGISTRY}
            docker pull ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
            cd ${APP_DIR}
            export IMAGE_TAG=${IMAGE_TAG}
            docker compose run --rm app npm run db:deploy
            docker compose up -d app
          '
        """
      }
    }

    stage('Health check') {
      when { expression { env.GIT_BRANCH in ['origin/master', 'master'] } }
      steps {
        sh """
          for i in \$(seq 1 10); do
            if curl -fsS ${PUBLIC_URL}/ > /dev/null; then echo OK; exit 0; fi
            sleep 6
          done
          echo "Health check failed"; exit 1
        """
      }
    }
  }

  post {
    failure { echo 'Build failed - production untouched.' }
    always  { sh 'docker image prune -f || true' }
  }
}
