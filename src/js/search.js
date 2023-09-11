import axios from 'axios';

let imgPerPage = 0;

async function fetchImages(searchQuery, page) {
  const resp = await axios(`https://pixabay.com/api/`, {
    params: {
      key: '39367777-ee931ad198c903143d54ad3fe',
      q: searchQuery,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      page,
      per_page: 40,
    },
  });
  imgPerPage = resp.config.params.per_page;
  return resp.data;
}

export {fetchImages, imgPerPage}