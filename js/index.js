/**
 *   State 
 */
let CURRENTPAGE = 1;
let STATE = {};
const getPropsFromState = (page, id) => {
  return STATE[page][id] || {};
};
const getCurrentPage = () => CURRENTPAGE;
const setCurrentPage = page => CURRENTPAGE = page;
const addPageToState = (page) => STATE[page] = {};
const deletePageFromState = page => delete STATE[page];
const addItemToState = (page, id, props) => STATE[page][id] = props;
const deleteItemFromState = (page, id) => delete STATE[page][id];

/**
 *   Data factory
*/
const DATA = {};

/**
 *   Dom factory
 */

const generateDom = (tag, props = {}) => {
  const element = document.createElement(tag);
  const {
    className = '',
    attributes = {}
  } = props;

  const classes = className.split(' ').filter(cls => cls !== '');
  (classes.length > 0) && element.classList.add(...classes);

  for( const [key, value] of Object.entries(attributes) ) {
    element.setAttribute( key, value )
  }

  return element
};

const generatePage = () => {
  return generateDom('div', {
    className: 'page_a4',
    attributes: {
      "data-page-count": appCountPage() + 1
    }
  });
};

const generateBlock = () => generateDom('div', {
  className: 'block',
  attributes: {
    id: utils.randomID(),
    "data-page": getCurrentPage()
  } 
});

const generateTextBlock = (props = {}) => {
  const { isPrimary = true, style = '' } = props;
  const primary = isPrimary ? 'text-primary' : 'text-secondary';
  const element = generateDom('div', {
    className: `text ${primary}`,
    attributes: {
      contenteditable: true,
      style
    }
  });

  element.textContent = "Enter Text";

  return element;
};

const generateLink = (props = {}) => {
  const element = generateDom('a', {
    className: `text text-secondary`,
    attributes: {
      contenteditable: true,
      style: "text-decoration:underline;font-size: 12px;"
    }
  });

  element.textContent = "Enter Text";

  return element;
};

const generateBlockTitle = () => {
  const div = generateDom('div', { className: 'box_underline' });
  const h3 = itemFactory.h3();
  h3.style.letterSpacing = "1.3px";
  
  div.appendChild(h3);

  return div;
};

const generateTitleContent = () => {
  const div = generateDom('div'); 
  
  const title = itemFactory.text();
  title.style.textTransform = "uppercase";
  title.style.fontWeight = '600';
  title.style.fontSize = '14px;';

  const text = itemFactory.text();

  div.appendChild(title);
  div.appendChild(text);

  return div
};

const generateLine = ({ type }) => {
  const div = generateDom('div');
  let width = 0;
  let height = 0;

  switch(type) {
    case "vertical":
      width = "700px";
      height = "2px";
    break;

    case "horizontal":
      width = "2px";
      height = "950px";
      break;
    
    case "short":
      height = "2px";
      width = "480px";
      break;
  }

  div.style.cssText = `width:${width};height:${height};background-color:#ddd`;

  return div
}

const generateItem = (type) => {
  const block = generateBlock();
  const child = itemFactory[type]();

  block.setAttribute("data-block-type", type);
  block.appendChild(child);

  eventInteract(block);

  return block;
};

const itemFactory = {
  "h1": () => generateTextBlock({ style: 'font-size:36px;font-weight:500;' }),
  "h3": () => generateTextBlock({ style: 'font-size:21px;font-weight:500;' }),
  "subHeader": () => generateTextBlock({ style: 'font-size:14px', isPrimary: false }),
  "jobTitle": () => generateTextBlock({ style: 'font-size:16px;font-weight:bold;', isPrimary: false }),
  "text": () => generateTextBlock({ style: 'font-size:12px', isPrimary: false }),
  "textBold": () => generateTextBlock({ style: 'font-size:12px;font-weight:600;', isPrimary: false }),
  "link": () => generateLink(),
  "blockTitle": () => generateBlockTitle(),
  "titleContent": () => generateTitleContent(),
  "verticalLine": () => generateLine({ type: 'vertical' }),
  "horizontalLine": () => generateLine({ type: 'horizontal' }),
  "shortVerticalLine": () => generateLine({ type: 'short' }),
};

/**
 *   Operation
 */

function app() {
  const app = document.querySelector('#appPDF');
  return {
    appCountPage: () => document.querySelectorAll('.page_a4').length,

    appAddPage: () => {
      const page = generatePage();
      app.appendChild(page);

      const pageCount = appCountPage();
      addPageToState( pageCount );
      updateSelectOptions( pageCount );
    },

    pageAddItem: (page = 1, child) => {
      const { id } = child;
      app
        .querySelector(`div[data-page-count="${page}"]`)
        .appendChild(child);
      
      addItemToState(page, id, { x: 0, y: 0 });
    }
  }
}

function updateSelectOptions(page) {
  const select = document.querySelector('#pageSelect');
  const option = generateDom('option', {
    attributes: {
      value: page
    }
  });

  option.textContent = page;
  select.appendChild(option)
}

const {
  appCountPage,
  appAddPage,
  pageAddItem
} = app();

function link() {
  let domID = "";
  const linkPanel = document.querySelector('#panelLink');
  const input = linkPanel.querySelector('input');

  input.addEventListener('change', (event) => {
    if (domID === '') return;
    const linkBlock = document.querySelector(`#${domID} > a`);
    linkBlock.setAttribute('href', event.target.value)
  });

  return {
    toggleLinkPanel: (toShow) => linkPanel.style.display = toShow ? 'block' : 'none',
    setDOMID: id => domID = id,
    resetDomID: () => domID = ""
  }
}

const {
  toggleLinkPanel,
  setDOMID,
  resetDomID
} = link()

/**
 *   Event
 */

const eventInteract = (element) => {
  interact(element)
    .draggable({
      modifiers: [
        interact.modifiers.snap({
          targets: [
            interact.createSnapGrid({ x: 15, y: 15 })
          ],
          range: Infinity,
          relativePoints: [ { x: 0, y: 0 } ]
        }),
        interact.modifiers.restrict({
          restriction: element.parentNode,
          elementRect: { top: 1, left: 1, bottom: 1, right: 1 },
          endOnly: true
        })
      ],
      inertia: true
    })
    .on('dragmove', function (event) {
      const { id } = event.target;
      const page = event.target.getAttribute('data-page') || 1;
      const props = getPropsFromState(page, id);

      props.x += event.dx
      props.y += event.dy

      const { x, y } = props;
      event.target.style.webkitTransform =
      event.target.style.transform =
        `translate(${x}px, ${y}px)`;
    })
};

const eventContextMenu = (event) => {
  console.log(event.target)
  return false;
};

const eventAddItem = event => {
  event.preventDefault();

  const itemType = event.target.getAttribute('data-block-type');
  const item = generateItem(itemType);
  const page = getCurrentPage();

  pageAddItem(page, item);
};

const eventAddPage = () => {
  appAddPage();
};

const eventChangePage = (event) => {
  const page = event.target.value;
  setCurrentPage(page);
};

const eventDownloadPDF = () => {
  const pages = document.querySelector('#appPDF');
  html2pdf()
    .set({
      filename:     'myfile.pdf',
      image:        { type: 'png', quality: 1 },
      html2canvas:  { scale: 1 },
    })
    .from(pages)
    .save();
};

const eventLinkAction = (event) => {
  const { tagName } = event.target;
  const isLink = tagName.toLowerCase() === 'a';

  if(isLink) {
    const id = event.target.parentElement.id;
    toggleLinkPanel(true);
    setDOMID(id);
  } else {
    toggleLinkPanel(false);
    resetDomID();
  }
}

/**
 *   utils
 */
const utils = {
  randomID: () => `block_${Math.random(1,1000).toString(16).slice(2)}`
};

/**
 *   main
 */

function main() {
  appAddPage();

  const buttons = [ ...document.querySelectorAll('.btn-ele') ];
  buttons.forEach(
    button => button.addEventListener('click', eventAddItem)
  );

  const addPageButton = document.querySelector('#addPage');
  addPageButton.addEventListener('click', eventAddPage);

  const pageSelect = document.querySelector('#pageSelect');
  pageSelect.addEventListener('change', eventChangePage);

  const downloadPDF = document.querySelector('#downloadPDF');
  downloadPDF.addEventListener('click', eventDownloadPDF);

  const app = document.querySelector('#appPDF');
  app.addEventListener('click', eventLinkAction)
}

main();