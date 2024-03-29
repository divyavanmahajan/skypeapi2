# Skype Log service

AWS_PROFILE=skypelogs sls create_domain
AWS_PROFILE=skypelogs aws acm list-certificates

Philips is deployed in eu-central-1

[Serverless Stack](https://serverless-stack.com) is a free comprehensive guide to creating full-stack serverless applications. We create a [note taking app](https://demo2.serverless-stack.com) from scratch.

This repo is used in the [Best Practices section](https://serverless-stack.com/chapters/best-practices-for-building-serverless-apps.html) of the guide.

#### Usage

To use this repo locally you need to have the [Serverless framework](https://serverless.com) installed.

```bash
$ npm install serverless -g
```

Clone this repo.

```bash
$ git clone https://github.com/divyavanmahajan/skypeapi2
```

Go to one of the services in the `services/` dir.

And run this to deploy to your AWS account.

```bash
$ serverless deploy
```

The services are dependent on the resources that are created [in this accompanying repo](https://github.com/divyavanmahajan/skypeapi2-resources).

#### Maintainers

Serverless Stack is authored and maintained by Frank Wang ([@fanjiewang](https://twitter.com/fanjiewang)) & Jay V ([@jayair](https://twitter.com/jayair)). [**Subscribe to our newsletter**](https://emailoctopus.com/lists/1c11b9a8-1500-11e8-a3c9-06b79b628af2/forms/subscribe) for updates on Serverless Stack. Send us an [email][email] if you have any questions.

[email]: mailto:contact@anoma.ly
