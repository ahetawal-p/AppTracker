import got from 'got';

export const postToSlack = async (slackUrl, data) => {
  try {
    const response = await got.post(slackUrl, {
      json: data
    });
    console.log(`slack response: ${response.body}`);
  } catch (error) {
    console.log(error);
  }
};
