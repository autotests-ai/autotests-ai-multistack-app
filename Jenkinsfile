// GHA tests-lane twin (not the full CI graph: no Sonar, Pages, unit, CD).
// Dispatch equivalent: deploy=tests + run_mock + run_api + run_e2e (screenshots on).
// Layers: tests/jenkins/gha-tests-path.sh ← selenide .github/actions/{mock,api,e2e}.
// GHA stays canon for push/PR/CD.
// Selenoid: credentialsId selenoid-guest-remote-url (WebDriver) and
// selenoid-guest-playwright-url (Playwright WS). Mock stays local CFT.

pipeline {
  agent { label 'java-jdk21' }

  options {
    disableConcurrentBuilds(abortPrevious: false)
    timeout(time: 90, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '30'))
    timestamps()
  }

  parameters {
    choice(
      name: 'TESTS_UI_LIBRARY',
      choices: ['selenide', 'selenium', 'playwright'],
      description: 'Java UI cell (one per run, same as GHA tests_ui_library)'
    )
    booleanParam(name: 'RUN_MOCK', defaultValue: false, description: 'ui-tests: compose mock + ui + screenshot (needs Docker; java-jdk21 has no docker.sock)')
    booleanParam(name: 'RUN_API', defaultValue: true, description: 'api-tests-stage and api-tests (prod)')
    booleanParam(name: 'RUN_E2E', defaultValue: true, description: 'e2e flows (exclude screenshot tag)')
    booleanParam(name: 'RUN_SCREENSHOTS', defaultValue: true, description: 'screenshot slice on mock / stage / prod')
    booleanParam(name: 'UPDATE_MOCK_SCREENSHOTS', defaultValue: false, description: 'rewrite mock PNGs (skip compare)')
    booleanParam(name: 'UPDATE_STAGE_SCREENSHOTS', defaultValue: false, description: 'rewrite stage PNGs (skip compare)')
    booleanParam(name: 'UPDATE_E2E_SCREENSHOTS', defaultValue: false, description: 'rewrite prod PNGs (skip compare)')
  }

  environment {
    ALLURE_ENDPOINT = 'https://allure.qa.guru'
    ALLURE_PROJECT_ID = '5274'
    ALLURE_SERVER_ID = 'Allure TestOps'
    ALLURE_RESULTS = 'allure-results-ci'
    BACKEND_LANG = 'java'
    BACKEND_FRAMEWORK = 'spring'
    FRONTEND_LANG = 'typescript'
    FRONTEND_FRAMEWORK = 'react'
    PUBLIC_HOST = 'autotests.ai'
    STAGE_PUBLIC_HOST = 'stage.autotests.ai'
    STACK_MOUNT = 'stack'
    CHROME_FOR_TESTING_VERSION = '148.0.7778.178'
    MOCK_GATEWAY_PORT = '9911'
    SCREENSHOT_OS = 'linux'
    SCREENSHOT_BROWSER = 'chrome'
    JIRA_URL = 'https://jira.qa.guru'
    CONFLUENCE_URL = 'https://confluence.qa.guru'
    TESTS_UI_LIBRARY = "${params.TESTS_UI_LIBRARY}"
    RUN_MOCK = "${params.RUN_MOCK}"
    RUN_API = "${params.RUN_API}"
    RUN_E2E = "${params.RUN_E2E}"
    RUN_SCREENSHOTS = "${params.RUN_SCREENSHOTS}"
    UPDATE_MOCK_SCREENSHOTS = "${params.UPDATE_MOCK_SCREENSHOTS}"
    UPDATE_STAGE_SCREENSHOTS = "${params.UPDATE_STAGE_SCREENSHOTS}"
    UPDATE_E2E_SCREENSHOTS = "${params.UPDATE_E2E_SCREENSHOTS}"
    SELENOID_WEBDRIVER_URL = credentials('selenoid-guest-remote-url')
    SELENOID_PLAYWRIGHT_URL = credentials('selenoid-guest-playwright-url')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare') {
      steps {
        sh 'bash tests/jenkins/gha-tests-path.sh prepare'
      }
    }

    stage('Tests') {
      steps {
        script {
          def launchName = "Jenkins tests-lane ${params.TESTS_UI_LIBRARY} — autotests-ai-multistack-app #${env.BUILD_NUMBER}"
          withAllureUpload(
            serverId: env.ALLURE_SERVER_ID,
            projectId: env.ALLURE_PROJECT_ID,
            credentialsId: 'allure-testops-api-token',
            name: launchName,
            tags: "jenkins,autotests-ai-multistack-app,tests-lane,${params.TESTS_UI_LIBRARY}",
            results: [[path: env.ALLURE_RESULTS]],
            silent: true
          ) {
            if (params.RUN_MOCK || params.UPDATE_MOCK_SCREENSHOTS) {
              stage('UI mock') {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                  sh 'bash tests/jenkins/gha-tests-path.sh mock'
                }
              }
            }
            if (params.RUN_API) {
              stage('API stage') {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                  sh 'bash tests/jenkins/gha-tests-path.sh api stage'
                }
              }
            }
            if (params.RUN_E2E || params.RUN_SCREENSHOTS || params.UPDATE_STAGE_SCREENSHOTS) {
              stage('E2E stage') {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                  sh 'bash tests/jenkins/gha-tests-path.sh e2e stage'
                }
              }
            }
            if (params.RUN_API) {
              stage('API prod') {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                  sh 'bash tests/jenkins/gha-tests-path.sh api prod'
                }
              }
            }
            if (params.RUN_E2E || params.RUN_SCREENSHOTS || params.UPDATE_E2E_SCREENSHOTS) {
              stage('E2E prod') {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                  sh 'bash tests/jenkins/gha-tests-path.sh e2e prod'
                }
              }
            }
          }
        }
      }
    }

    stage('Allure 3 report') {
      when {
        expression {
          return fileExists(env.ALLURE_RESULTS) &&
            sh(script: "ls -A '${env.ALLURE_RESULTS}' 2>/dev/null | head -1", returnStatus: true) == 0
        }
      }
      steps {
        sh """
          mkdir -p '${env.ALLURE_RESULTS}'
          cat > '${env.ALLURE_RESULTS}/executor.json' <<EOF
          {
            "name": "Jenkins",
            "type": "jenkins",
            "reportName": "Run #${env.BUILD_NUMBER}",
            "buildOrder": ${env.BUILD_NUMBER},
            "buildName": "${env.JOB_NAME} #${env.BUILD_NUMBER}",
            "buildUrl": "${env.BUILD_URL}",
            "reportUrl": "${env.BUILD_URL}allure/"
          }
          EOF
        """
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          script {
            def cell = "tests/java/tests-java-gradle-junit5-allure3-${params.TESTS_UI_LIBRARY}"
            allure(
              allureVersion: '3',
              includeProperties: false,
              results: [[path: env.ALLURE_RESULTS]],
              configPath: "${cell}/allurerc.mjs"
            )
          }
        }
      }
    }

    stage('Links') {
      steps {
        script {
          currentBuild.displayName = "#${env.BUILD_NUMBER} · ${params.TESTS_UI_LIBRARY}"
          currentBuild.description = "GHA tests-lane · TestOps/${env.ALLURE_PROJECT_ID}"
          echo "TestOps ${env.ALLURE_ENDPOINT}/project/${env.ALLURE_PROJECT_ID}"
          echo "Jira ${env.JIRA_URL}/projects/REF · Confluence ${env.CONFLUENCE_URL}/display/REF"
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'allure-results-ci/**', allowEmptyArchive: true, fingerprint: true
    }
  }
}
