pipeline {
  agent any
  environment {
    DISCORD_WEBHOOK = credentials('discord-webhook')
  }
  options {
    skipStagesAfterUnstable()
  }
  stages {
    stage('Install Dependencies') {
      steps {
        yarn 'install --frozen-lockfile'
      }
    }
    stage('Build') {
      steps {
        yarn 'prisma generate'
        yarn 'build:prod'
      }
    }
    stage('Check Style') {
      parallel {
        stage('Check Linting') {
          steps {
            yarn 'lint:ci'
          }
          post {
            always {
              recordIssues enabledForFailure: true, aggregatingResults: true, tool: checkStyle(pattern: 'eslint.xml')
            }
          }
        }
        stage('Check Formatting') {
          steps {
            yarn 'format:check'
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
      discordSend webhookURL: DISCORD_WEBHOOK, description: "**[$JOB_NAME #$BUILD_NUMBER](${JENKINS_URL}blue/organizations/jenkins/Botler/detail/master/$BUILD_NUMBER/pipeline) was unsuccessful**"
    }
  }
}
