const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=ceff7dc5-6264-4508-952e-7a3530d8b47f';

async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    }
    
    catch (error) {
      console.error(error);
    }
}

fetchObjects().then(x => console.log(x));

async function fetchAllCenturies(){
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;

    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        const records = data.records;
    
        return records;
    }
    
    catch (error) {
        console.error(error);
    }
}

async function fetchAllClassifications(){
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
    
    if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'));
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        const records = data.records;
    
        return records;
    }
    
    catch (error) {
        console.error(error);
    }
}

async function prefetchCategoryLists() {
    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
    ]);
        $('.classification-count').text(`(${ classifications.length })`);

        classifications.forEach(classification => {
            $('#select-classification').append(`<option value="${classification.name}">${classification.name}</option>`)
        });

        $('.century-count').text(`(${ centuries.length })`);
    
        centuries.forEach(century => {
            $('#select-century').append(`<option value="${century.name}">${century.name}</option>`)
        });
    }
    
    catch (error) {
      console.error(error);
    }
}

prefetchCategoryLists()

function buildSearchString(){
    const baseUrl = `${BASE_URL}/object?${KEY}`;
    const keywords = `keyword=${ $('#keywords').val()}`;

    const terms = [...$('#search select')].map(word => {
        return `${$(word).attr('name')} = ${$(word).val()}`
    })

    let newUrl = `${baseUrl}&${terms}&${keywords}`

    let encodedUrl = encodeURI(newUrl)
    
    return encodedUrl
}

$('#search').on('submit', async function (event) {
    event.preventDefault()
    onFetchStart()

    try {
        const response = await fetch(buildSearchString());
        const {records, info} = await response.json();
        console.log(info, 'info', records, 'records')
        updatePreview(records, info)
    }

    catch (error) {
        console.error(error);
    }

    finally {
        onFetchEnd()
    }
    
});

function onFetchStart() {
    $('#loading').addClass('active');
  }
  
  function onFetchEnd() {
    $('#loading').removeClass('active');
  }

function renderPreview(record) {

    const {
      description,
      primaryimageurl,
      title,
    } = record;
  
    return $(`<div class="object-preview">
      <a href="#">
      ${
        primaryimageurl && title
        ? `<img src="${ primaryimageurl }" /><h3>${ title }<h3>`
        : title
        ? `<h3>${ title }<h3>`
        : description
        ? `<h3>${ description }<h3>`
        : `<img src="${ primaryimageurl }" />`
      }
      </a>
    </div>`).data('record', record);
  
}
  
  
function updatePreview(records, info) {
    const root = $('#preview');

    if (info.next) {
      root.find('.next')
        .data('url', info.next)
        .attr('disabled', false);
    } else {
      root.find('.next')
        .data('url', null)
        .attr('disabled', true);
    }
    
    if (info.prev) {
      root.find('.previous')
        .data('url', info.prev)
        .attr('disabled', false);
    } else {
      root.find('.previous')
        .data('url', null)
        .attr('disabled', true);
    }
  
    const results = root.find('.results')

    results.empty()

    records.forEach(result=>{
        results.append(renderPreview(result))
    })

    results.animate({ scrollTop: 0 }, 500);
}

$('#preview').on('click', '.object-preview', function (event) {
  event.preventDefault();

  const record = $(this).data('record');
  
  const featureElement = $('#feature');
  featureElement.html( renderFeature(record) );  
});

  function renderFeature(record){
    const { 
      title, 
      dated,
      images,
      primaryimageurl,
      description,
      culture,
      style,
      technique,
      medium,
      dimensions,
      people,
      department,
      division,
      contact,
      creditline,
    } = record;
  
    return $(`<div class="object-feature">
      <header>
        <h3>${ title }<h3>
        <h4>${ dated }</h4>
      </header>
      <section class="facts">
        ${ factHTML('Description', description) }
        ${ factHTML('Culture', culture, 'culture') }
        ${ factHTML('Style', style) }
        ${ factHTML('Technique', technique, 'technique' )}
        ${ factHTML('Medium', medium ? medium.toLowerCase() : null, 'medium') }
        ${ factHTML('Dimensions', dimensions) }
        ${ 
          people 
          ? people.map(
              person => factHTML('Person', person.displayname, 'person')
            ).join('')
          : ''
        }
        ${ factHTML('Department', department) }
        ${ factHTML('Division', division) }
        ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }
        ${ factHTML('Credit', creditline) }
      </section>
      <section class="photos">
        ${ photosHTML(images, primaryimageurl) }
      </section>
    </div>`);
  }

  function searchURL(searchType, searchString) {
    return `${ BASE_URL }/object?${ KEY }&${ searchType}=${ searchString }`;
  }
  
  function factHTML(title, content, searchTerm = null) {
    if (!content) {
      return ''
    }
  
    return `
      <span class="title">${ title }</span>
      <span class="content">${
        searchTerm && content
        ? `<a href="${BASE_URL}/object?${KEY}&${ searchTerm }=${encodeURI(content.split('-').join('|')) }">${ content}</a>`: content}
      </span>
    `
  }

  function photosHTML(images, primaryimageurl) {
    if (images.length > 0) {
      return images.map(
        image => `<img src="${ image.baseimageurl }" />`).join('');
    } else if (primaryimageurl) {
      return `<img src="${ primaryimageurl }" />`;
    } else {
      return '';
    }
  }

  $('#feature').on('click', 'a', async function (event) {
    const href = $(this).attr('href');
  
    if (href.startsWith('mailto:')) {
      return;
    }
  
    event.preventDefault();
  
    onFetchStart();
    try {
      let result = await fetch(href);
      let { records, info } = await result.json();
      updatePreview(records, info);
    } catch (error) {
      console.error(error)
    } finally {
      onFetchEnd();
    }
  });

  $('#preview .next, #preview .previous').on('click', async function () {
    onFetchStart();
  
    try {
      const url = $(this).data('url');
      const response = await fetch(url);
      const { records, info } = await response.json();  
      
      updatePreview(records, info);
    } catch (error) {
      console.error(error);
    } finally {
      onFetchEnd();
    }
  });
  