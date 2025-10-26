
document.getElementById('send-action').addEventListener('click',async function (event) {
    event.preventDefault();
    console.log('Submit user request', event);
    const actionValue = document.getElementById('action').value.trim();
    const characterId = sessionStorage.getItem('characterId') ?? getCookie('characterId');

    const payload = {
        characterId,
        action: actionValue,
    };

    if (window.onAction) {
        await window.onAction(payload).then(r => r)
    }
})
