const axios = require('axios').default;
const cheerio = require('cheerio');

const options_selector = '#content > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > select > option';

const uni_selector = '#content > table > tbody > tr > td > ol > li > a';

const extract_number = (data) => {
    const x = data.split('(');
    const y = parseInt(x[x.length - 1].split(')'));
    return y;
}

(async () => {
    const world_uni = [];
    const us_uni = [];

    const res = await axios.get('https://univ.cc/world.php');

    let $ = cheerio.load(res.data);

    const countries = [];
    Array.from($(options_selector))
        .splice(1)
        .forEach((a) => {
            const total = extract_number(a.firstChild.data);
            countries.push({
                code: a.attribs["value"],
                total: total
            });
        });

    for (let i = 0; i < countries.length; i++) {
        const c = countries[i];
        console.log(`Getting ${c.code} data`);
        let start = 1;
        while (start < c.total) {
            const url = `https://univ.cc/search.php?dom=${c.code}&key=&start=${start}`;
            const res = await axios.get(url);
            const $ = cheerio.load(res.data);
            Array.from($(uni_selector))
                .forEach((uni) => {
                    const web = uni.attribs['href'];
                    const name = uni.firstChild.data;
                    const country = c.code;
                    world_uni.push({
                        web,
                        name,
                        country
                    });
                });
            start += 50;
        }
    }
    //TODO:Add United States

})();