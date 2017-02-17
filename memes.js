const request = require('superagent');
const cheerio = require('cheerio');

const SEARCH_URL = 'http://www.ubiaoqing.com/search/';
const keyword    = '单身狗';
let page         = 1;
let linkAssemble = []; // 链接集合


async function getLinksByPage (keyword, page) {
    try {

        // step1 获取页面
        console.log(`获取页面 -> 关键字: ${keyword} 第${page}页`);
        let html    = await requestURL(keyword, page);

        // step2 解析数据
        console.log(`解析数据...`);
        let links   = selectLink(html);

        // step3 清洗脏数据
        console.log('清洗数据...');
        let result  = cleanseLink(links);

        // 将结果添加到linksAssemble
        Array.prototype.push.apply(linkAssemble, result);

        // 如果有下一页继续抓取下页表情包链接
        if ( html.includes('下一页') ) {
            return getLinksByPage(keyword, ++ page);
        }

        return linkAssemble;

    } catch(err) {
        // 错误则跳过当前页，继续抓取！
        console.error(err.message);
        return getLinksByPage(keyword, ++ page);
    }
}

getLinksByPage(keyword, page);

/**
 * @requestURL
 * @param   keyword {String} 搜索关键字
 * @param   page    {String} 页数
 * @return  request
 * */
function requestURL(keyword, page) {
    let url = `${ SEARCH_URL }${ encodeURI(keyword) }/${ page }`;   // 抓取地址
    return request.get(url).then(res => res.text);
}

/**
 * @requestURL
 * @param   html    {String} 待解析的html
 * @return  links   {Array}
 * */
function selectLink (html) {
    let $ = cheerio.load(html); // 加载html到cheerio
    // 遍历所有的标签并获取href属性
    return Array.from($('li .ver-middle').map(function () {
        return $(this).find('img').attr('src');
    }))
}

/**
 * @cleanseLink
 * @param   links    {Array} 待清洗的link
 * @return  links    {Array}
 * */
function cleanseLink (links) {
    return links.filter((link) => link.includes('http://ubq.ubiaoqing.com/ubiaoqing'));
}