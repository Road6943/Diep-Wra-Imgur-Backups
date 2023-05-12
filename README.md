This script will backup all the soon-to-be-deleted imgur links in the Diep WRA.

# Steps
0. Install all the prerequisites:
   - Node.js (>= v12.18.4) at https://nodejs.org/en/download
   - In terminal, run `npm install cloudinary sync-fetch` 

1. Make a cloudinary.com account and get your cloudName, apiKey, and apiSecret. You can find these by using the sidebar to go to `Programmable Media > Dashboard`. You can generate a new apiKey and apiSecret by going to `Settings > Access Keys`. You can disable your api key there as well.

2. In `rescueDiepWraImgurPics.js`, optionally change the CONSTANTS at the top of the file.

3. In terminal, run `node rescueDiepWraImgurPics.js cloudName apiKey apiSecret`. This will generate an output jsonlines file. Each line of the jsonlines file is a JSON object with 1 key and 1 value. The key is an imgur link and the value is the new cloudinary link for that imgur link.

4. Using the terminal output, identify any failed links. Try rerunning the script if there's any to upload any links that previously failed because of rate limit issues. Next, if a link is still failing because of 404 errors (the image was previously deleted) then add it to the `known404Links` variable in the script. If a link is failing because it is not a direct imgur link (such as /a/ or /gallery/ links) then check to see if the link has an account displayed. If not, then manually reupload the images in the album to another image host and add manually a new line to the jsonl output file with the imgur link mapping to the new link.