const locale = 'us-EN';

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
    const { sheet } = form.dataset;

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
    const textarea = form.querySelector('textarea');
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

const setupRating = () => {
    const rateRadios = document.querySelectorAll('fieldset > input[type="radio"]');
    rateRadios.forEach((radio) => {
        radio.addEventListener("click", radioClicked);
    });
};

setupRating();