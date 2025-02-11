export const getFileSize = (file)=> {
    if (!file) return "No file selected";
    const units = ["bytes", "KB", "MB", "GB"];
    let size = file.size;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
export const getTime = (timestamp)=> {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
}
export const findUrls=(str)=> {
    if (typeof str !== 'string' || !str) return null;
    return str.match(/https?:\/\/[^\s/$.?#].[^\s]*/g);
}
export const createHyperLinks=(str)=> {
    if (typeof str !== 'string' || !str) return str;
    return str.replace(/https?:\/\/[^\s/$.?#].[^\s]*/g, (url) => {
      return `<a href="${url}" onfocus="getMetaData(this.href)" class="cs-link" target="_blank">${url}</a>`;
    });
}

export const getMetaData=(url)=>{
    fetch(url)
    .then(response => {
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const firstImage = doc.querySelector('img');
        const firstParagraph = doc.querySelector('p');
        const firstHeading = doc.querySelector('h1');
        console.log('First Image:', firstImage ? firstImage.src : 'No image found');
        console.log('First Paragraph:', firstParagraph ? firstParagraph.textContent : 'No paragraph found');
        console.log('First Heading:', firstHeading ? firstHeading.textContent : 'No heading found');
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });

}
