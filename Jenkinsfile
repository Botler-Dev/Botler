pipeline {
  agent {
    docker {
      image 'node:15-alpine'
      reuseNode true
      args '-v $HOME/yarn-cache:/yarn-cache'
    }
  }
  environment {
    YARN_CACHE_FOLDER = '/yarn-cache'
    DISCORD_WEBHOOK = credentials('discord-webhook')
  }
  options {
    skipStagesAfterUnstable()
  }
  stages {
    stage('Install Dependencies') {
      steps {
        sh 'yarn install --frozen-lockfile'
      }
    }
    stage('Build') {
      steps {
        sh 'yarn prisma generate'
        sh 'yarn build:prod'
      }
    }
    stage('Check Style') {
      parallel {
        stage('Check Linting') {
          steps {
            sh 'yarn lint:ci'
          }
          post {
            always {
              recordIssues enabledForFailure: true, aggregatingResults: true, tool: checkStyle(pattern: 'eslint.xml')
            }
          }
        }
        stage('Check Formatting') {
          steps {
            sh 'yarn format:check'
          }
        }
      }
    }
    stage('Deploy') {
      when { branch 'latest' }
      steps {
        echo 'Hello, deploy me pls'
      }
    }
  }
  post {
    unsuccessful {
      discordSend webhookURL: DISCORD_WEBHOOK, title: '[$JOB_NAME #$BUILD_NUMBER](BUILD_URL) was unsuccessful'
    }
  }
}
