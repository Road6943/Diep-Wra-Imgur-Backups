This script will backup all the soon-to-be-deleted imgur links in the Diep WRA.

# Steps
0. Install all the prerequisites:
   - Node.js (>= v12.18.4) at https://nodejs.org/en/download
   - In terminal, run `npm install cloudinary sync-fetch` 

1. Make a cloudinary.com account and get your cloudName, apiKey, and apiSecret. You can find these by using the sidebar to go to `Programmable Media > Dashboard`. You can generate a new apiKey and apiSecret by going to `Settings > Access Keys`. You can disable your api key there as well.

2. In `rescueDiepWraImgurPics.js`, change the CONSTANTS at the top of the file. Most are optional, but `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_API_KEY` are required.

3. In terminal, run `node rescueDiepWraImgurPics.js cloudName apiKey apiSecret`. This will generate an output jsonlines file. Each line of the jsonlines file is a JSON object with 1 key and 1 value. The key is an imgur link and the value is the new cloudinary link for that imgur link.