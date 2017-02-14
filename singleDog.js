const fs      = require('fs');
const request = require('superagent');
const cheerio = require('cheerio');

const SEARCH_URL = 'http://www.ubiaoqing.com/search/';

let memeLinks = [];

(async function crawler() {
    let keyword = '单身狗';
    let links = await requestLink(keyword);
    await timerChunk(links, downloadMeMe, 5);
    console.log('完成！');
})();


function timerChunk(any, fn, limit) {
    let run = function () {
        if (!any.length) {
            return;
        }

        let params = any.splice(0, limit);
        let queue  = params.map((param) => fn(param));
        return Promise.all(queue).then(run);
    }

    return run();
}

function downloadMeMe (url) {
    return new Promise((resolve, reject) => {
        console.log(`下载: ${url}`);
        request.get(url).pipe(fs.createWriteStream(`./memes/${url.substr(-22)}`)).on('close', resolve);
    })
}

function requestLink(keyword, page) {

    page = page || 1;

    let url = `${ SEARCH_URL }${ encodeURI(keyword)}/${page}`;
    console.log(`搜索关键字：${keyword}, 当前页${page}`);

    return request.get(url).then((res) => {

        let $ = cheerio.load(res.text);

        let links = Array.from($('li .ver-middle').map(function () {
            return $(this).find('img').attr('src');
        }));

        // 过滤广告链接
        let result = links.filter((link) => link.includes('http://ubq.ubiaoqing.com/ubiaoqing'));

        memeLinks = memeLinks.concat(result);

        let isLastPage = res.text.includes('下一页');

        return isLastPage ? requestLink(keyword, ++page) : memeLinks;
    })
}