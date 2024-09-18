import * as secret_env from './environment.prod.json';

export const environment = {
    production: true,
    sheetId: '1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI',
    sheetProductsGid: '1383014775',
    sheetDeliveryGid: '1555741237',
    getProductsFromGoogleAsJSONUrl: 'https://docs.google.com/spreadsheets/d/1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI/gviz/tq?tqx=out:json&tq&gid=1383014775',
    getDeliveryFromGoogleAsJSONUrl: 'https://docs.google.com/spreadsheets/d/1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI/gviz/tq?tqx=out:json&tq&gid=1555741237',
    sendDataToTelegramUrl: 'https://script.google.com/macros/s/AKfycbwlCuaEVwPrvOUgkO7BxCYstfYvowC_1PPhRXjKMl3zVUiRaWpWPWBulYBntf-Ia_Y/exec',
    DADATA_API_KEY: secret_env.DADATA_API_KEY,
    masterChatId:"1376405450;619864883",
    masterUserName:"chebatz;NatrishaChe",
    maxCartItems: 10,
    maxCartItemPosition: 10,
    webAppDirectLink: "https://t.me/prokrasotubot",
    gitHubCdnApiToken:  secret_env.GITHUB_CDN_API_TOKEN

};
