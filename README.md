# Cognitive Head Hunter - GBS Watson Challenge Application

  Cognitive Head Hunter is a cognitive based system to designed to help both a candidate and a HR professional make a good match more quickly and more reliably using Watson to read and extract cognitive information from the both the candidates providing a better match between them, not only by analyzing keywords but also by understanding the concepts outlined within a resume or a job posting.
  
## Getting Started

1. Create a Bluemix Account

    [Sign up][sign_up] in Bluemix, or use an existing account. Watson Services in Beta are free to use.

2. Download and install the [Cloud-foundry CLI][cloud_foundry] tool

3. Connect to Bluemix in the command line tool.
  ```sh
  $ cf api https://api.ng.bluemix.net
  $ cf login -u <your user ID>
  ```

4. Create the Concept Insights service in Bluemix.
  ```sh
  $ cf create-service concept-insights free concept-insights-service
  ```
  
5. Create the Personality Insights service in Bluemix.
  ```sh
  $ cf create-service personality-insights free personality-insights-service
  ```
  
6. Create the MongoLab service in Bluemix.
  ```sh
  $ cf create-service mongolab sandbox mongolab-service
  ```
  
7. Fork or download this project to your local machine.
  
8. Go to the project folder and edit the `manifest.yml` file and change the `<application-name>` to something unique.
  ```none
  applications:
  - services:
    - concept-insights-service
    - personality-insights-service
    - mongolab-service
    name: <application-name>
    command: node app.js
    path: .
    memory: 256M
  ```
  The name you use will determinate your application url initially, e.g. `<application-name>.mybluemix.net`.

8. Push it live!
  ```sh
  $ cf push
  ```

See the full [Getting Started][getting_started] documentation for more details, including code snippets and references.

## Running on Bluemix
  This application uses [LinkedIn][linkedin] integration so you will have to create and application on [Linkedin][linkedin] as part of the steps below.
  
1. Create two corpus in the `concept-insights-service` service in Bluemix, one for the candidates and other for the jobs opportunities, using Concept Insights REST API. You can see the API [Here][watson_api].

2. Create two environment variables in Bluemix named `candidates_corpus` and `jobs_corpus` and copy the two `Corpus ID` from the corpus you created to the variables accordingly

3. Create a new [LinkedIn][linkedin] application to obtain keys needed in our integration. You can create it [Here][linkedin_app]

4. Create two environment variables in Bluemix named `linkedin_appKey` and `linkedin_appSecret` and copy the `appKey` and `appSecret` from your [LinkedIn][linkedin] app to the variables
 
5. Go to the project folder in a terminal and push it:
    ```sh
  $ cf push
  ```
  
6. Go to `<application-name>.mybluemix.net` to see your own copy up and running!

## Troubleshooting

To troubleshoot your Bluemix app the main useful source of information are the logs, to see them, run:

  ```sh
  $ cf logs <application-name> --recent
  ```

## License

  This project code is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).

## Contributing

  See [CONTRIBUTING](CONTRIBUTING.md).

## Open Source @ IBM
  Find more open source projects on the [IBM Github Page](http://ibm.github.io/)

[cloud_foundry]: https://github.com/cloudfoundry/cli
[getting_started]: http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/
[sign_up]: https://apps.admin.ibmcloud.com/manage/trial/bluemix.html?cm_mmc=WatsonDeveloperCloud-_-LandingSiteGetStarted-_-x-_-CreateAnAccountOnBluemixCLI
[watson_api]: http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/apis/#!/concept-insights/createCorpus
[linkedin_app]: https://www.linkedin.com/developer/apps/new
[linkedin]: https://www.linkedin.com/