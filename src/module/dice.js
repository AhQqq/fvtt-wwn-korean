export class OseDice {
  static digestResult(data, roll) {
    let result = {
      isSuccess: false,
      isFailure: false,
      target: "",
    };
    // ATTACKS
    let die = roll.parts[0].total;
    if (data.rollData.type == "Attack") {
      if (game.settings.get("ose", "ascendingAC")) {
        let bba = data.data.thac0.bba;
        if (data.rollData.stat == "melee") {
          bba += data.data.thac0.mod.melee + data.rollData.scores.str.mod;
        } else if (data.rollData.stat == "missile") {
          bba += data.data.thac0.mod.missile + data.rollData.scores.dex.mod;
        }
        result.target = bba;
        if (die == 1) {
          result.isFailure = true;
          return result;
        }
        result.isSuccess = true;
      } else {
        // B/X Historic THAC0 Calculation
        let thac = data.data.thac0.value;
        if (data.rollData.stat == "melee") {
          thac -= data.data.thac0.mod.melee + data.rollData.scores.str.mod;
        } else if (data.rollData.stat == "missile") {
          thac -= data.data.thac0.mod.missile + data.rollData.scores.dex.mod;
        }
        result.target = thac;
        if (thac - roll.total > 9) {
          result.isFailure = true;
          return result;
        }
        result.details = `<div class='roll-result'><b>Hits AC ${Math.clamped(
          thac - roll.total,
          -3,
          9
        )}</b> (${thac})</div>`;
      }
    } else if (data.rollData.type == "Above") {
      // SAVING THROWS
      let sv = data.rollData.target;
      result.target = sv;
      if (roll.total >= sv) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.rollData.type == "Below") {
      // Morale
      let m = data.rollData.target;
      result.target = m;
      if (roll.total <= m) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.rollData.type == "Check") {
      // SCORE CHECKS
      let sc = data.rollData.target;
      result.target = sc;
      if (die == 1 || (roll.total <= sc && die < 20)) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.rollData.type == "Exploration") {
      // EXPLORATION CHECKS
      let sc = data.data.exploration[data.rollData.stat];
      result.target = sc;
      if (roll.total <= sc) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    }
    return result;
  }

  static async sendRoll({
    parts = [],
    data = {},
    title = null,
    flavor = null,
    speaker = null,
    form = null,
  } = {}) {
    const template = "systems/ose/templates/chat/roll-attack.html";

    let chatData = {
      user: game.user._id,
      speaker: speaker,
    };

    let templateData = {
      title: title,
      flavor: flavor,
      data: data,
    };

    // Optionally include a situational bonus
    if (form !== null) data["bonus"] = form.bonus.value;
    if (data["bonus"]) parts.push(data["bonus"]);

    const roll = new Roll(parts.join("+"), data).roll();

    // Convert the roll to a chat message and return the roll
    let rollMode = game.settings.get("core", "rollMode");
    rollMode = form ? form.rollMode.value : rollMode;

    templateData.result = OseDice.digestResult(data, roll);

    return new Promise((resolve) => {
      roll.render().then((r) => {
        templateData.rollOSE = r;
        renderTemplate(template, templateData).then((content) => {
          chatData.content = content;
          // Dice So Nice
          if (game.dice3d) {
            game.dice3d
              .showForRoll(
                roll,
                game.user,
                true,
                chatData.whisper,
                chatData.blind
              )
              .then((displayed) => {
                ChatMessage.create(chatData);
                resolve();
              });
          } else {
            chatData.sound = CONFIG.sounds.dice;
            ChatMessage.create(chatData);
            resolve();
          }
        });
      });
    });
  }

  static async Roll({
    parts = [],
    data = {},
    options = {},
    event = null,
    skipDialog = false,
    speaker = null,
    flavor = null,
    title = null,
    item = false,
  } = {}) {
    let rollMode = game.settings.get("core", "rollMode");
    let rolled = false;

    const template = "systems/ose/templates/chat/roll-dialog.html";
    let dialogData = {
      formula: parts.join(" "),
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.Dice.rollModes,
    };

    let buttons = {
      ok: {
        label: game.i18n.localize("OSE.Roll"),
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (html) => {
          roll = OseDice.sendRoll({
            parts: parts,
            data: data,
            title: title,
            flavor: flavor,
            speaker: speaker,
            form: html[0].children[0],
          });
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("OSE.Cancel"),
      },
    };

    if (skipDialog) {
      return OseDice.sendRoll({
        parts,
        data,
        title,
        flavor,
        speaker,
      });
    }

    const html = await renderTemplate(template, dialogData);
    let roll;

    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: title,
        content: html,
        buttons: buttons,
        default: "ok",
        close: () => {
          resolve(rolled ? roll : false);
        },
      }).render(true);
    });
  }
}
