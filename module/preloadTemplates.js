export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Character Sheets
        'systems/wwn-kor/templates/actors/character-sheet.html',
        'systems/wwn-kor/templates/actors/monster-sheet.html',
        'systems/wwn-kor/templates/actors/faction-sheet.html',
        //Actor partials
        //Sheet tabs
        'systems/wwn-kor/templates/actors/partials/character-header.html',
        'systems/wwn-kor/templates/actors/partials/character-attributes-tab.html',
        'systems/wwn-kor/templates/actors/partials/character-spells-tab.html',
        'systems/wwn-kor/templates/actors/partials/character-inventory-tab.html',
        'systems/wwn-kor/templates/actors/partials/character-notes-tab.html',

        'systems/wwn-kor/templates/actors/partials/monster-header.html',
        'systems/wwn-kor/templates/actors/partials/monster-attributes-tab.html',

        'systems/wwn-kor/templates/actors/partials/faction-assets.html'
    ];
    return loadTemplates(templatePaths);
};
