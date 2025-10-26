
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

/**
 * TODO сделать отображение инвентаря
 *
 * 1.привязать действие к кнопе инвенторя как вверху
 * 2.свформировать JSON из characterId как выше
 * 3.в main.js сделать новый хук getInventory
 * 4. в game.routes.ts добавить новый рут /character для получения инфы о персонаже по аналогии с другими рутами (Не забудь что это GET запрос а не POST)
 * 5. вернуть из /character объект в main.js хук, из main.js передать его в game.js
 * 6. game.js отрисовывает страничку на основании данных полученных с сервера
 */