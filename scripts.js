const postURL = 'https://ccgrowth.servicebus.windows.net/formsink/messages';
const postAuth = 'SharedAccessSignature sr=https%3A%2F%2Fccgrowth.servicebus.windows.net%2Fformsink%2Fmessages&sig=RFndMU%2FyHZrlchNBfHlIdulld4URAgUAQdAlqVLf1Bw%3D&se=1634259041&skn=send';
const testURL = 'https://adobeioruntime.net/api/v1/web/helix-clients/ccgrowth/forms-handler@v1';

const getDate = () => {
    return new Date().toISOString().replace(/[TZ]/g, ' ').split('.')[0].trim();
};

const getForm = (el) => {
    return el.closest('form');
}

const sendRequest = (target) => {
    const form = getForm(target);
    const { sheet , locale } = form.dataset;

    const data = [
        { name: 'timestamp', value: getDate() },
        { name: 'Rating', value: target.value },
        { name: 'Locale', value: locale }
    ];

    const body = { sheet, data };

    fetch(postURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': postAuth,
        },
        body: JSON.stringify(body),
    });
};

const showComments = (radio) => {
    const form = radio.closest('form');
    const textarea = form.querySelector('.hlx-Review-commentFields');
    textarea.classList.add('is-Visible');
};

const radioClicked = (e) => {
    const { value } = e.target;
    if (value <= 2) {
        showComments(e.target);
    } else {
        sendRequest(e.target);
    }
    e.target.classList.add('is-Clicked');
};

/**
 * When the form is hovered, detect if the hovered element was a rating.
 *
 * Yes, dear listener: you can do this in CSS. To get a flawless UX without
 * a ton of CSS is not worth it. This is overall less code.
 * @param {HTMLElement} el the element that was hovered
 * @param {NodeList} radios the radios to act on
 */
const formHovered = (el, radios) => {
    const { name, value } = el;
    if (name === 'rating') {
        radios.forEach((radio) => {
            radio.value <= value ?
                radio.classList.add('is-Active') :
                radio.classList.remove('is-Active');
        });
    }
};

const formLeft = (radios) => {
    radios.forEach((radio) => {
        radio.classList.remove('is-Active');
    });
};

const setupReview = () => {
    const reviewForms = document.querySelectorAll('.hlx-Review');
    reviewForms.forEach((form) => {
        const rateRadios = form.querySelectorAll('input[type="radio"]');

        // Setup hover and leave event
        // This is purely for UX.
        form.addEventListener('mouseover', function(e) {
            formHovered(e.target, rateRadios);
        });

        form.addEventListener('mouseleave', function(e) {
            formLeft(rateRadios);
        });

        // Setup click event
        rateRadios.forEach((radio) => {
            radio.addEventListener('click', radioClicked);
        });
    });
};

/**
 * A utility to overcome some of the weirdness of MD + CSS class names.
 * TODO: remove when there's a proper HTML file
 */
const setupMarkdownJank = () => {
    const forms = document.querySelectorAll('form[data-sheet]');
    forms.forEach((form) => {
        form.classList.add('hlx-Review');
        form.querySelector('fieldset:first-of-type').classList.add('hlx-Review-ratingFields');
        form.querySelector('fieldset:last-of-type').classList.add('hlx-Review-commentFields');
    });
};

setupMarkdownJank();
setupReview();