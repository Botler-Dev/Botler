pipeline {
  agent any
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
}
