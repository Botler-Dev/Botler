def deployCompose (command) {
  yarn "docker:prod --project-name Botler --env-file \$DEPLOY_CONFIG $command"
}

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
      environment {
        DEPLOY_CONFIG = credentials('deploy-config')
      }
      /* when { branch 'latest' } */
      steps {
        script {
          deployCompose('build bot')
          if (0 != sh('git diff --exit-code $GIT_PREVIOUS_COMMIT $GIT_COMMIT migrations', returnStatus: true)) {
            deployCompose('stop bot')
            deployCompose('run --rm bot node_modules/.bin/prisma migrate deploy')
          }
          deployCompose('up --detach')
        }
      }
    }
  }
  post {
    unsuccessful {
      discordSend webhookURL: DISCORD_WEBHOOK, description: "**[$JOB_NAME #$BUILD_NUMBER](${JENKINS_URL}blue/organizations/jenkins/Botler/detail/master/$BUILD_NUMBER/pipeline) was unsuccessful**"
    }
  }
}
