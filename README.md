# Cognitive Head Hunter - GBS Watson Challenge Application

  Cognitive Head Hunter is a cognitive based system to designed to help both a candidate and a HR professional make a good match more quickly and more reliably using Watson to read and extract cognitive information from the both the candidates providing a better match between them, not only by analyzing keywords but also by understanding the concepts outlined within a resume or a job posting.
  
Give it a try! Click the button below to fork into IBM DevOps Services and deploy your own copy of this application on Bluemix.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://hub.jazz.net/git/alanbraz/job-hunters)

## Getting Started

1. Create a Bluemix Account

    [Sign up][sign_up] in Bluemix, or use an existing account. Watson Services in Beta are free to use.

2. Download and install the [Cloud-foundry CLI][cloud_foundry] tool

3. Edit the `manifest.yml` file and change the `<application-name>` to something unique.
  ```none
  applications:
  - services:
    - concept-insights-service
    - personality-insights-service
    name: <application-name>
    command: node app.js
    path: .
    memory: 256M
  ```
  The name you use will determinate your application url initially, e.g. `<application-name>.mybluemix.net`.

4. Connect to Bluemix in the command line tool.
  ```sh
  $ cf api https://api.ng.bluemix.net
  $ cf login -u <your user ID>
  ```

5. Create the Concept Insights service in Bluemix.
  ```sh
  $ cf create-service concept-insights free concept-insights-service
  ```
  
6. Create the Personality Insights service in Bluemix.
  ```sh
  $ cf create-service personality-insights free personality-insights-service
  ```

7. Push it live!
  ```sh
  $ cf push
  ```

See the full [Getting Started][getting_started] documentation for more details, including code snippets and references.

## Running locally
  The application uses [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.com/) so you will have to download and install them as part of the steps below.
  
1. Create two corpus in the `concept-insights-service` service in Bluemix, one for the candidates and other for the jobs opportunities, using Concept Insights REST API. You can see the API [Here][watson_api].

2. Create two environment variables in Bluemix named `candidates_corpus` and `jobs_corpus` and copy the two `Corpus ID` from the corpus you created to the variables accordingly

3. Create a new Linkedin application to obtain keys needed in our integration. You can create it [Here][linkedin_app]

4. Create two environment variables in Bluemix named `linkedin_appKey` and `linkedin_appSecret` and copy the `appKey` and `appSecret` from your Linkedin app to the variables
 
5. Copy the credentials from your `concept-insights-service` and `personality-insights-service` services in Bluemix to `app.js`, you can see the credentials using:

    ```sh
    $ cf env <application-name>
    ```
    Example output:
    ```sh
    System-Provided:
    {
    "VCAP_SERVICES": {
        "concept-insights": [
            {
                "credentials": {
                    "password": "<password>",
                    "url": "<url>",
                    "username": "<username>"
                },
                "label": "concept-insights",
                "name": "concept-insights-service",
                "plan": "free"
            }
        ],
        "personality-insights": [
            {
                "credentials": {
                    "password": "<password>",
                    "url": "<url>",
                    "username": "<username>"
                },
                "label": "personality-insights",
                "name": "personality-insights-service",
                "plan": "free"
            }
        ]
    }
}	
    ```

    You need to copy `username`, `password` and `url`.

6. Install [Node.js](http://nodejs.org/)
7. Go to the project folder in a terminal and run:
    `npm install`
8. Start the application
9.  `node app.js`
10. Go to `http://localhost:3000`

## Troubleshooting

To troubleshoot your Bluemix app the main useful source of information are the logs, to see them, run:

  ```sh
  $ cf logs <application-name> --recent
  ```

## License

  This sample code is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).

## Contributing

  See [CONTRIBUTING](CONTRIBUTING.md).

## Open Source @ IBM
  Find more open source projects on the [IBM Github Page](http://ibm.github.io/)

[cloud_foundry]: https://github.com/cloudfoundry/cli
[getting_started]: http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/
[sign_up]: https://apps.admin.ibmcloud.com/manage/trial/bluemix.html?cm_mmc=WatsonDeveloperCloud-_-LandingSiteGetStarted-_-x-_-CreateAnAccountOnBluemixCLI
[watson_api]: http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/apis/#!/concept-insights/createCorpus
[linkedin_app]: https://www.linkedin.com/developer/apps/new