const axios = require('axios').default;
const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const fs = require('fs');

// Selector for World universities pages and united states universities pages
const options_selector = '#content > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > select > option';

// Selector for Countries pages or States pages
const uni_selector = '#content > table > tbody > tr > td > ol > li > a';

// Number extractor for String like: Turkey (92)
const extract_number = (data) => {
    const x = data.split('(');
    const y = parseInt(x[x.length - 1].split(')'));
    return y;
}

(async () => {
    // All JSONs gonna added to this array
    const all_uni = [];

    // Source websites
    const sites = ['https://univ.cc/world.php', 'https://univ.cc/states.php'];

    console.info("Use 'node index.js' command from a terminal if you can't see progress !");

    for (const site of sites) {
        const res = await axios.get(site);
        let $ = cheerio.load(res.data);

        // All countries or states
        const options = [];

        // Extract option data from page
        Array.from($(options_selector))
            .splice(1)
            .forEach((a) => {
                // Getting total university count for pagination
                const total = extract_number(a.firstChild.data);
                options.push({
                    code: a.attribs["value"],
                    total: total
                });
            });

        // Simple progress bar created
        const bar = new cliProgress.SingleBar({
            format: `Getting datas from ${site} | [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}  {message}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            stream: process.stdout,
        }, cliProgress.Presets.shades_classic);

        // Starting progress bar
        bar.start(options.length, 0);

        for (const option of options) {
            // For pagination
            let start = 1;

            // Updating progress bar message
            bar.update({
                message: `Current code is ${option.code}`,
            });

            // Check is next page exist
            while (start < option.total) {
                const url = `https://univ.cc/search.php?dom=${option.code}&key=&start=${start}`;
                const res = await axios.get(url);
                const $ = cheerio.load(res.data);

                // Extract university datas from page
                Array.from($(uni_selector))
                    .forEach((uni) => {
                        const website = uni.attribs['href'];
                        const name = uni.firstChild.data;
                        const code = option.code.replace('edu_', 'us_');
                        all_uni.push({
                            code,
                            name,
                            website
                        });
                    });
                // Go to next page if it is exist
                start += 50;
            }
            // Incrementing progress value
            bar.increment();
        }

        bar.update({ message: `Done!` });
        bar.stop();
    }

    // Sorting array for better looking
    all_uni.sort((a, b) => a.code.localeCompare(b.code));

    // Writing a file named 'world-universities.json'
    const data = JSON.stringify(all_uni, null, 4);
    console.log("Writing to file...");
    fs.writeFileSync('world-universities.json', data);
    console.log("Done!");
})();