const PROXY_GROUP_KEY = "proxy-groups"
const PROXY_RULE_KEY = "rules"
const PROXIES_KEY = "proxies"
const PROXIES_RULE_PROVIDER_KEY = "rule-providers"
const CONFIG_URL = "https://raw.githubusercontent.com/TLocation/clash_rules/master/append_rule.yaml"

module.exports.parse = async (raw, { axios, yaml, notify, console }, { name, url, interval, selected }) => {
    const obj = yaml.parse(raw)
    await parsePortYaml(axios, yaml, console, false, obj)
    return yaml.stringify(obj)
}

/*start test code    */

/*

console.log("start test code");
const yaml = require('js-yaml');
const fs = require('fs');
const axios = require('axios')
const data = fs.readFileSync("/Users/tianxiaolong/Downloads/test.yaml")
// console.log("data:" + data);
const obj = yaml.load(data)
parsePortYaml(axios, yaml, console, true, obj).then(Unit => {
    console.log("end test code")
    fs.writeFileSync("/Users/tianxiaolong/Downloads/test.yaml", yaml.dump(obj), 'utf8');
})


*/

/* end test code */
async function parsePortYaml(axios, yaml, console, test, obj) {
    console.log("start process")

    let { headers: {}, status, data } = await axios.get(CONFIG_URL)

    if (status == 200) {
        console.log("get config data success")
        var configObj;
        if(test){
            configObj = yaml.load(data)
        }else{
            configObj = yaml.parse(data)
        }
        filterProxyGroups(console, obj, configObj["filter-proxy-group"])
        mergeRules(obj, configObj)
        mergeRuleProvider(obj, configObj)
    }else{
        console.log("get config data error code:" + status)
    }
    addChatgptGroup(console, obj);
    console.log("end process")
}


function mergeRules(rawObj, configObj){
    if(rawObj[PROXY_RULE_KEY] == undefined){
        rawObj[PROXY_RULE_KEY] = []
    }

    if(configObj["prepend-rules"] != undefined){
        rawObj[PROXY_RULE_KEY].unshift(...configObj["prepend-rules"])
    }

    if(configObj["append-rules"] != undefined){
        rawObj[PROXY_RULE_KEY].push(...configObj["append-rules"])
    }
}


function mergeRuleProvider(rawObj, configObj){
    if(rawObj[PROXIES_RULE_PROVIDER_KEY] == undefined){
        rawObj[PROXIES_RULE_PROVIDER_KEY] = {}
    }

    if(configObj["mix-rule-providers"] != undefined){
        rawObj[PROXIES_RULE_PROVIDER_KEY] = {...rawObj[PROXIES_RULE_PROVIDER_KEY], ...configObj["mix-rule-providers"]}
    }

}


function addChatgptGroup(console, obj) {
    const newProxyGroup = {
        name: "ChatGpt",
        type: "select",
        proxies: [],
    };
    newProxyGroup.proxies.push("自动选择");

    obj[PROXIES_KEY].forEach(proxy => {
        if (proxy.name.includes("-") && !proxy.name.includes("香港") && !proxy.name.includes("日本") && !proxy.name.includes("澳门")) {
            newProxyGroup.proxies.push(proxy.name);
        }
    });
    obj[PROXY_GROUP_KEY].push(newProxyGroup);

    obj[PROXY_RULE_KEY].unshift("DOMAIN-KEYWORD,openai,ChatGpt");
    console.log("添加代理组:" + newProxyGroup.name)
}

function filterProxyGroups(console, obj, filterArray) {
    var deleteGroups = []
    const proxyGroup = obj[PROXY_GROUP_KEY]
    proxyGroup.forEach(group => {
        const r = filterArray.find(item => {
            return item.name == group.name
        })
        if (r != undefined) {
            console.log("删除代理组:" + group.name)
            deleteGroups.push(group)
            replaceRule(console, obj, r.name, r.rule)
        }
    })

    deleteGroups.forEach(group => {
        obj[PROXY_GROUP_KEY].splice(proxyGroup.indexOf(group), 1)
    })
}


function replaceRule(console, obj, oldRule, newRule) {
    obj[PROXY_RULE_KEY].filter(rule => {
        return oldRule == rule.split(",")[2]
    }).forEach(rule => {
        console.log("rule:" + rule + " 更新规则:" + oldRule + " 为" + newRule)
        const newRuleLine = rule.replace(oldRule, newRule)
        obj[PROXY_RULE_KEY][obj[PROXY_RULE_KEY].indexOf(rule)] = newRuleLine
    });
}











