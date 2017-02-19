'use strict'
const request = require('superagent');
const cheerio = require('cheerio');
const fs      = require('fs');

const SEARCH_URL = 'http://www.ubiaoqing.com/search/';
const keyword    = '单身狗';
let page         = 1;
let linkAssemble = []; // 链接集合


(async function crawler() {
    let keyword = '单身狗';
    try {
        let links = await getLinksByPage(keyword, 1);
        await timerChunk(links, downloadMeMe, 5, 3000);
        console.log('完成！');
    } catch (err) {
        console.error(err);
    }
})();

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

        console.log(linkAssemble);

        return linkAssemble;

    } catch(err) {
        // 错误则跳过当前页，继续抓取！
        console.error(err.message);
        return getLinksByPage(keyword, ++ page);
    }
}

/**
 * 下载表情包到本地
 * @param   url {String} 表情包地址
 * @return
 * */
function downloadMeMe (url) {
    return new Promise((resolve, reject) => {
        console.log(`下载: ${url}`);
        let filePath = `./memes/${url.substr(-22)}`;    // 取到后22位作为文件名
        let stream   = fs.createWriteStream(filePath);  // 创建一个可写 stream 对象
        // 请求表情包地址，并 pipe 到刚才创建的 stream 对象
        request.get(url).pipe(stream).on('close', resolve)
    });
}

/**
 * 获取页面
 * @param   keyword {String} 搜索关键字
 * @param   page    {String} 页数
 * @return  request
 * */
function requestURL(keyword, page) {
    let url = `${ SEARCH_URL }${ encodeURI(keyword) }/${ page }`;   // 抓取地址
    return request.get(url).then(res => res.text);
}

/**
 * 解析表情包链接
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
 * 清洗脏数据
 * @param   links    {Array} 待清洗的link
 * @return  links    {Array}
 * */
function cleanseLink (links) {
    return links.filter((link) => link.includes('http://ubq.ubiaoqing.com/ubiaoqing'));
}

/**
 * 限流器
 * @param   any   {Array}       参数数组
 * @param   fn    {Function}    要执行的函数
 * @param   limit {Number}      并发数
 * @param   wait  {Number}      延时 单位ms 默认0
 * */

function timerChunk(any, fn, limit, wait = 0) {
    let run = async function () {
        if (!any.length) {
            return;
        }

        // 延时等待 这里是随机0到wait毫秒
        await (new Promise((resolve, reject) => setTimeout(resolve, ~~(Math.random() * wait))));

        let params = any.splice(0, limit);              // 每次取出 limit 数量的任务
        let queue  = params.map((param) => fn(param));  // 调用函数，返回Promise数组 这里默认fn是返回Promise
        return Promise.all(queue).then(run);            // 等待Promise数组执行完成继续调用run
    }

    return run();
}