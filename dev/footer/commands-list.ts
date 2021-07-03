/** Общие команды **/
Commands.register({
    name: "//help",
    description: "Help.",
    args: "[page/command]",
    call: function (args) {
        var page = args[0] ? parseInt(args[0]) : 1;

        if (isNaN(page)) {
            var cmd = args[0];
            if (!Commands.has(args[0]))
                cmd = "//" + args[0];


            if (Commands.has(cmd)) {
                const command = Commands.get(cmd);

                var message = command.name + " ";
                if (command.args != null) message += command.args + " ";
                message += "- " + Translation.translate(command.description);

                Game.message(message);
            } else {
                Game.message(Translation.translate("There is no such command."));
            }
        } else {
            const _page = page - 1;
            let message: string = "";

            const commands = Object.values(Commands.getListCommands());
            let i = 6 * _page;
            const l = i + 6;

            for (; i < l; i++) {
                const command = commands[i];
                message += command.name + " ";
                if (command.args != null) message += command.args + " ";
                message += "- " + Translation.translate(command.description) + "\n";
            }
            Game.message(Translation.translate("===Help [Page %page%]===\n%cmd%===Help [Page %page%]===").replace(/(%page%)/g, page.toString()).replace("%cmd%", message));
        }
    }
});
Commands.register({
    name: "//?",
    description: "Help.",
    args: "[page/command]",
    call: Commands.get("//help").call
});
Commands.register({
    name: "//limit",
    description: "Set the maximum number of <limit> blocks used for commands. Acts only on you. Used to prevent catastrophic incidents.",
    args: "<limit>",
    call: function (args) {
        if (!args[0] || isNaN(parseInt(args[0])))
            return Game.message(Translation.translate("Don't valid command."));

        const newLimit = parseInt(args[0]);
        WorldEdit.setLimit(newLimit);
        Game.message(
            Translation.translate("The maximum number of blocks used with the commands %blocks%.")
                .replace(/(%blocks%)/g, newLimit.toString())
        );
    }
});

/** Перемещение **/
/** Операции с биомами **/
/** Создание **/
/** Выделение **/
Commands.register({
    name: "//pos1",
    description: "Set selection position #1 to the block above the one that you are standing on.",
    args: "[<x> <y> <z>]",
    call: function (args) {
        var coords: Vector;
        if (args[0] === undefined) {
            coords = Player.getPosition();
            coords.x = Math.round(coords.x);
            coords.y = Math.round(coords.y);
            coords.z = Math.round(coords.z);

        } else {
            if (args[1] === undefined || args[2] === undefined)
                return Game.message(Translation.translate("Don't valid command."));

            coords = {
                x: parseInt(args[0]),
                y: parseInt(args[1]),
                z: parseInt(args[2])
            };
        }

        WorldEdit.setPosition(0, coords);
        Game.message(
            Translation.translate("The first position is set to %x%,%y%,%z%.")
                .replace("%x%", coords.x.toString())
                .replace("%y%", coords.y.toString())
                .replace("%z%", coords.z.toString())
        );
        const size = WorldEdit.getSizeArea();
        const message = Translation.translate(__n(size, "%count% block.", "%count% blocks.")).replace("%count%", size.toString());
        Game.message(
            Translation.translate("The selected region is %sizeArea%")
                .replace("%sizeArea%", message)
        );
    }
});
Commands.register({
    name: "//pos2",
    description: "Set selection position #2 to the block above the one that you are standing on.",
    args: "[<x> <y> <z>]",
    call: function (args) {
        var coords: Vector;
        if (args[0] === undefined) {
            coords = Player.getPosition();
            coords.x = Math.round(coords.x);
            coords.y = Math.round(coords.y);
            coords.z = Math.round(coords.z);

        } else {
            if (args[1] === undefined || args[2] === undefined)
                return Game.message(Translation.translate("Don't valid command."));

            coords = {
                x: parseInt(args[0]),
                y: parseInt(args[1]),
                z: parseInt(args[2])
            };
        }

        WorldEdit.setPosition(1, coords);
        Game.message(
            Translation.translate("The second position is set to %x%,%y%,%z%.")
                .replace("%x%", coords.x.toString())
                .replace("%y%", coords.y.toString())
                .replace("%z%", coords.z.toString())
        );
        const size = WorldEdit.getSizeArea();
        const message = Translation.translate(__n(size, "%count% block.", "%count% blocks.")).replace("%count%", size.toString());
        Game.message(
            Translation.translate("The selected region is %sizeArea%")
                .replace("%sizeArea%", message)
        );
    }
});

Commands.register({
    name: "//wand",
    description: "Gives you the \"EditWand\".",
    args: "",
    call: function () {
        Player.addItemToInventory(wand_id, 1, 0);
    },
});
Commands.register({
    name: "//toggleeditwand",
    description: "Toggles the edit wand selection mode, allowing you to use the edit wand item normally.",
    args: "",
    call: function () {
        WorldEdit.toggleWand();
        Game.message(Translation.translate("Mode wand edit switched."));
    }
});
Commands.register({
    name: "//desel",
    description: "Deselects the current selection.",
    args: "",
    call: function () {
        for(let i = 0; i < 2; i++)
        WorldEdit.setPosition(i, { x: Infinity, y: Infinity, z: Infinity });

        Callback.invokeCallback("worldedit.desel");

        Game.message(Translation.translate("The current selection is canceled."));
    }
});

Commands.register({
    name: "//size",
    description: "Get size area.",
    args: "[-с]",
    call: function (args) {
        let size: number;
        if (args[0] == "-c") {
            // Game.message(WorldEdit.getMessageSize(WorldEdit.copy.length, 0));
            size = WorldEdit.getSizeArea();
        } else {
            size = WorldEdit.getSizeArea();
        }
        Game.message(Translation.translate(__n(size, "%count% block.", "%count% blocks.")).replace("%count%", size.toString()));
    }
});

/** Операции с регионом **/

Commands.register({
    name: "//set",
    description: "Set all blocks inside the selection region to a specified block.",
    args: "<block>",
    call: function (args) {
        runOnMainThread(function () {
            if (!args[0])
                return Game.message(Translation.translate("Don't valid command."));

            if (!WorldEdit.checkValidPosition())
                return Game.message(Translation.translate("Set both positions."));

            const block: string[] = args[0].split(":");
            const id: number = parseInt(block[0]);
            const data: number = block[1] ? parseInt(block[1]) : 0;
            // var undo = [];
            let count: number = 0;
            const pos1 = WorldEdit.getPosition(0);
            const pos2 = WorldEdit.getPosition(1);
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            for (var x = pos1.x; x <= pos2.x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = pos1.y; y <= pos2.y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = pos1.z; z <= pos2.z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;

                        // let tile = world.getBlock(x, y, z);

                        // undo.push([x, y, z, tile.id, tile.data]);
                        world.setBlock(x, y, z, id, data);

                        count++;
                    }
                }
            }
            // WorldEdit.undo.push(undo);

            Game.message(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});
