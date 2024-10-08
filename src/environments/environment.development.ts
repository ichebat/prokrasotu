import * as secret_env from '../assets/environment.development.json';

const crypt = (salt, text) => {
  const textToChars = (text) => text.split('').map((c) => c.charCodeAt(0));
  const byteHex = (n) => ('0' + Number(n).toString(16)).substr(-2);
  const applySaltToChar = (code) =>
    textToChars(salt).reduce((a, b) => a ^ b, code);

  return text
    .split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
};

export const decrypt = (salt, encoded) => {
  const textToChars = (text) => text.split('').map((c) => c.charCodeAt(0));
  const applySaltToChar = (code) =>
    textToChars(salt).reduce((a, b) => a ^ b, code);
  return encoded
    .match(/.{1,2}/g)
    .map((hex) => parseInt(hex, 16))
    .map(applySaltToChar)
    .map((charCode) => String.fromCharCode(charCode))
    .join('');
};

export const environment = {
  production: false,
  sheetId: '1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI',
  sheetProductsGid: '1383014775',
  sheetDeliveryGid: '1555741237',
  getProductsFromGoogleAsJSONUrl:
    'https://docs.google.com/spreadsheets/d/1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI/gviz/tq?tqx=out:json&tq&gid=1383014775',
  getDeliveryFromGoogleAsJSONUrl:
    'https://docs.google.com/spreadsheets/d/1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI/gviz/tq?tqx=out:json&tq&gid=1555741237',
  sendDataToTelegramUrl:
    'https://script.google.com/macros/s/AKfycbwlCuaEVwPrvOUgkO7BxCYstfYvowC_1PPhRXjKMl3zVUiRaWpWPWBulYBntf-Ia_Y/exec',
  DADATA_API_KEY: crypt(secret_env.SECRETWORD, secret_env.DADATA_API_KEY),
  masterChatId: '1376405450;619864883',
  masterUserName: 'chebatz;NatrishaChe',
  maxCartItems: 10,
  maxCartItemPosition: 10,
  pass: secret_env.SECRETWORD,
  gitHubCdnApiToken: crypt(
    secret_env.SECRETWORD,
    secret_env.GITHUB_CDN_API_TOKEN,
  ),
  gitHubCdnOwner: 'ichebat',
  gitHubCdnRepo: 'prokrasotucdn',
  gitHubCdnFolder: 'uploads',

  owner: {
    form: 'ИП',
    name: 'Чеботарева Наталья Сергеевна',
    INN: '026100700987',
    marketDescription: 'Магазин профессиональной косметики',
    marketName: 'PROКРАСОТУ',
    marketAddress: 'г.Ишимбай, ТЦ Лето, Стахановская 35, Секция С6',
    telegramBot: 'ProKrasotuBot',
    startBotUrl: 'https://t.me/prokrasotubot?start=_shop',
    privacyUrl: 'https://t.me/prokrasotubot?start=_company_privacy',
    phoneText: '+7 917 491-81-37',
    phoneLink: '9174918317',
    telegram: 'NatrishaChe',
    whatsapp: '9174918317',
    vkLink: 'https://vk.com/prokrasotumarket',
    yandexMapText: 'г.Ишимбай, ТЦ Лето, Стахановская 35',
    about: [
      'Подбор и продажа профессиональной косметики для ВОЛОС, ЛИЦА и ТЕЛА, фены, плойки, утюжки.',
    ],
  },
};
