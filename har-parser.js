const parseHar = (harContents) => {
  // Load file (requires a web server, I'm using browsersync)
  const harEntries = harContents.log.entries;
  const harEntriesKeys = Object.keys(harEntries);

  // Table to put contents into
  const $resultsTable = document.getElementById('output');

  // Add table headings
  const $tableHeadWrapper = document.createElement('thead');
  const $tableHead = document.createElement('tr');
  $tableHeadWrapper.append($tableHead);
  const tableHeadings = [
    'File Name',
    '3rd Party',
    'URL',
    'Status',
    'Type',
    'Priority',
    'Initiator',
    'File Size',
    'File Size in Bytes',
    'Total Time',
  ];

  for (let i = 0; i < tableHeadings.length; i++) {
    const tableHeading = tableHeadings[i];
    const $currentTh = document.createElement('th');
    $currentTh.textContent = tableHeading;
    $tableHead.append($currentTh);
  }

  $resultsTable.append($tableHeadWrapper);

  // Add results
  const $tableBody = document.createElement('tbody');
  for (let i = 0; i < harEntriesKeys.length; i++) {
    const currentHarEntry = harEntries[harEntriesKeys[i]];
    const $currentRow = document.createElement('tr');

    /**
     * Data to pull
     */
    // Get filename
    const explodedUrl = currentHarEntry.request.url.split('/');
    let fileName = explodedUrl[explodedUrl.length - 1].split('?')[0];
    // When there's nothing after the last slash we need to get the value before the last slash
    if (fileName === '') {
      fileName = explodedUrl[explodedUrl.length - 2];
    }

    // Figure out if file is 3rd Party
    let isThirdPartyUrl = 'true';
    if (currentHarEntry.request.url.match(/http[s]:\/\/[\w.]+redhat\.com/g)) {
      isThirdPartyUrl = 'false';
    }

    // Figure out the initiator (if we can)
    let initiator = '';
    if (typeof currentHarEntry._initiator === 'object') {
      if (currentHarEntry._initiator.type === 'other') {
        initiator = currentHarEntry._initiator.type;
      }
      else if (currentHarEntry._initiator.type === 'script') {
        if (typeof currentHarEntry._initiator.stack.callFrames[0] !== 'undefined'
          && currentHarEntry._initiator.stack.callFrames[0].url !== 'undefined'
        ) {
          initiator = currentHarEntry._initiator.stack.callFrames[0].url;
        }
        else {
          initiator = '??';
        }
      }
      else if (typeof currentHarEntry._initiator.url === 'string') {
        initiator = currentHarEntry._initiator.url;
      }
      else {
        console.log(currentHarEntry.request.url, currentHarEntry._initiator);
      }
    }

    // Get size and create human-friendly size
    const sizeInBytes = parseInt(currentHarEntry.response.content.size);
    let fileSize = '0B';
    if (sizeInBytes < 1024) {
      fileSize = `${ sizeInBytes }B`;
    }
    else if (sizeInBytes >= 1024 ) {
      fileSize = `${ Math.round(sizeInBytes / 1024) }KB`;
    }

    // Get total time
    // Google doesn't seem to be counting the SSL time? Not sure why, I'm gonna
    const timingKeys = Object.keys(currentHarEntry.timings);
    let totalTime = 0;
    for (let i = 0; i < timingKeys.length; i++) {
      totalTime += currentHarEntry.timings[timingKeys[i]];
    }

    const columns = [
      fileName,
      isThirdPartyUrl,
      currentHarEntry.request.url,
      currentHarEntry.response.status,
      currentHarEntry._resourceType,
      currentHarEntry._priority,
      initiator,
      fileSize,
      sizeInBytes,
      totalTime / 1000,
    ];

    for (let j = 0; j < columns.length; j++) {
      const currentColumnValue = columns[j];
      const $currentTd = document.createElement('td');
      $currentTd.textContent = currentColumnValue;
      $currentRow.append($currentTd);
    }

    $tableBody.append($currentRow);
  }
  $resultsTable.append($tableBody);
};

let request = new XMLHttpRequest();
request.open('GET', 'access.stage.redhat.com.json');
request.responseType = 'json';
request.send();
request.onload = () => {
  parseHar(request.response);
};
