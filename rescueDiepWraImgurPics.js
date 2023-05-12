// Run with "node <thisFilesName.js> <cloudinaryCloudName> <cloudinaryApiKey> <cloudinaryApiSecret>"

// CONSTANTS - Change these if you need to:
const CLOUDINARY_FOLDER_NAME = "DiepWraImgurBackups";
const OUTPUT_JSONLINES_FILE = "DiepWraImgurBackupLinks.jsonl";
const TIME_DELAY_BETWEEN_API_CALLS_IN_SECONDS = 0.004;
//==============================================================

/*
    All links come from these two json files:
    - https://diep-wra.xyz/desktop.json
    - https://diep-wra.xyz/mobile.json

    They contain a total of 7702 imgur links as of May 11, 2023
    - 7700 of those are direct imgur links that were easily uploaded to cloudinary
    - https://i.imgur.com/yhkA58e.mp4 is a 404 link that has been deleted previously, 
        so it will be ignored
    - https://imgur.com/a/qhzJj is an album link with multiple direct image links within it
        -- It is the only non-direct-image imgur link
        -- Its associated record has a second link in the form of this youtube video: https://www.youtube.com/watch?v=k9fdYD_J0ec
        -- Because of these two reasons above, I manually uploaded the images to imgbb.com and added that row to the output file
        -- Here's the new link: https://ibb.co/album/NrRw8d?sort=name_asc&page=1
*/

const syncFetch = require('sync-fetch');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Read the jsonlines output file to see which files have already been uploaded
// Each line of the the jsonlines file contains an object with 1 key and 1 value
// The key is an imgur link and the value is that imgur link's new cloudinary link
// Returns a Set<string>
function getAlreadyUploadedLinks() {
    const alreadyUploadedLinks = new Set();

    // if output file doesn't exist, create it
    if (!fs.existsSync(OUTPUT_JSONLINES_FILE)) {
        fs.writeFileSync(OUTPUT_JSONLINES_FILE, ""); // make empty file
    }

    const outputFileContents = fs.readFileSync(OUTPUT_JSONLINES_FILE, "utf-8");
    for (let line of outputFileContents.split("\n")) {
        line = line.trim();
        if (line.length === 0) continue; // skip empty line

        const json = JSON.parse(line);
        for (const url in json) {
            alreadyUploadedLinks.add(url);
        }
    }

    return alreadyUploadedLinks;
}

// fetches all imgur links to upload
// returns a string[]
function getImgurLinks() {
    const jsonUrls = [
        "https://diep-wra.xyz/desktop.json", 
        "https://diep-wra.xyz/mobile.json",
    ];

    let known404Links = `
        https://i.imgur.com/yhkA58e.mp4
    `;
    known404Links = new Set(known404Links.split("\n").map(line => line.trim()));

    const imgurLinks = [];

    for (const jsonUrl of jsonUrls) {
        const jsonObj = syncFetch(jsonUrl).json();
        
        for (tank in jsonObj) {
            for (gamemode in jsonObj[tank]) {
                for (const record of jsonObj[tank][gamemode]) {
                    for (let link of record.proof) {
                        if (known404Links.has(link) || !link.includes('imgur.')) {
                            continue;
                        }
                        
                        imgurLinks.push( link.trim() );
                    }
                }
            }
        }
    }

    return imgurLinks;
}

// returns a cloudinary uploader obj
function getCloudinaryUploader() {
    const commandLineArgs = process.argv.slice(2);
    if (commandLineArgs.length < 3) {
        const filename = __filename.slice(__dirname.length + 1);
        console.log("You must provide 3 command line args to upload to Cloudinary!");
        console.log("node " + filename + " cloudName apiKey apiSecret")
        return null;
    }
    
    cloudinary.config({
        cloud_name: commandLineArgs[0],
        api_key: commandLineArgs[1],
        api_secret: commandLineArgs[2],
    });

    return cloudinary.uploader;
}

// returns string
function toBase64(string) {
    return Buffer.from(string).toString('base64');
}

async function uploadLinksToCloudinary(alreadyUploadedLinks, linksToUpload) {
    const failedLinks = [];
    let numLinksUploaded = alreadyUploadedLinks.size;

    const uploader = getCloudinaryUploader();
    if (uploader === null) {
        return;
    }

    for (const linkToUpload of linksToUpload) {
        if (alreadyUploadedLinks.has(linkToUpload)) continue;

        // this is a special case - the only non-direct-image imgur link
        // so I just manually re-uploaded it to imgbb.com
        if (linkToUpload === "https://imgur.com/a/qhzJj") {
            const newLink = "https://ibb.co/album/NrRw8d?sort=name_asc&page=1";
            const jsonLine = JSON.stringify({ [linkToUpload]: newLink }) + "\n";

            // append json line to file
            await fs.promises.appendFile(OUTPUT_JSONLINES_FILE, jsonLine, (err) => {
                console.log(err);
                failedLinks.push(linkToUpload);
            });

            console.log(`SPECIAL CASE :: Link ${++numLinksUploaded} of ${linksToUpload.length} :: ${linkToUpload}\n=> ${newLink}\n`);
            continue;
        }

        try {
            // slow down api calls
            await new Promise(resolve => setTimeout(resolve, 1000 * TIME_DELAY_BETWEEN_API_CALLS_IN_SECONDS));

            // if you don't do this, mp4 links break
            let resource_type = 'image';
            if (linkToUpload.endsWith('mp4')) {
                resource_type = 'video';
            }

            const res = uploader.upload(linkToUpload, {
                resource_type, 
                // convert url to base64 to make it a valid cloudinary file name
                public_id: `${CLOUDINARY_FOLDER_NAME}/${toBase64(linkToUpload)}`,
            });

            res.then(async (data) => {
                const jsonLine = JSON.stringify({ [linkToUpload]: data.secure_url }) + "\n";

                // append json line to file
                await fs.promises.appendFile(OUTPUT_JSONLINES_FILE, jsonLine, (err) => {
                    console.log(err);
                    failedLinks.push(linkToUpload);
                });

                console.log(`Link ${++numLinksUploaded} of ${linksToUpload.length} :: ${linkToUpload}\n=> ${data.secure_url}\n`);

            }).catch((err) => {
                console.log(err)
                failedLinks.push(linkToUpload);
            });

        } catch(err) {
            console.log(err.message);
            failedLinks.push(linkToUpload);
        }
    }

    console.log(`THERE WERE ${failedLinks.length} FAILED IMGUR LINK UPLOADS:`)
    for (const failedLink of failedLinks) {
        console.log("FAILED LINK: " + failedLink);
    }
}


function main() {
    const alreadyUploadedLinks = getAlreadyUploadedLinks();
    const imgurLinks = getImgurLinks();
    uploadLinksToCloudinary(alreadyUploadedLinks, imgurLinks);
}

main();