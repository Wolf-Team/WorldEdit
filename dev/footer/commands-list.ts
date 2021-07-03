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
        for (let i = 0; i < 2; i++)
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
interface SetHistoryObject {
    blocks: [number, number, number, number, number][];
    set: [number, number]
};
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
            const undo: SetHistoryObject = {
                blocks: [],
                set: [id, data]
            };
            let count: number = 0;
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            const pos1 = WorldEdit.getPosition(0);
            const pos2 = WorldEdit.getPosition(1);

            const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
            const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
            const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
            const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
            const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
            const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

            for (var x = start_x; x <= end_x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = start_y; y <= end_y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = start_z; z <= end_z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;

                        let tile = world.getBlock(x, y, z);

                        undo.blocks.push([x, y, z, tile.id, tile.data]);
                        world.setBlock(x, y, z, id, data);

                        count++;
                    }
                }
            }

            WorldEdit.History.push("//set", undo);

            Game.message(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    },
    historyCall: function (action: WorldEdit.HistoryAction, data: any) {
        if (!data) return;
        const SetInfo: SetHistoryObject = (<SetHistoryObject>data);
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();
            const count = SetInfo.blocks.length;
            for (let i = 0; i < count; i++) {
                const block: [number, number, number, number, number] = SetInfo.blocks[i];
                switch (action) {
                    case WorldEdit.HistoryAction.UNDO:
                        world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                        break;
                    case WorldEdit.HistoryAction.REDO:
                        world.setBlock(block[0], block[1], block[2], SetInfo.set[0], SetInfo.set[1]);
                        break;
                }

            }
            Game.message(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});
Commands.register({
    name: "//replace",
    description: "Replace all blocks of the specified block(s) with another block inside the region.",
    args: "[from_block] <to_block>",
    call: function (args) {
        runOnMainThread(function () {
            if (!args[0])
                return Game.message(Translation.translate("Don't valid command."));

            if (!WorldEdit.checkValidPosition())
                return Game.message(Translation.translate("Set both positions."));


            let from_block: [number, number] = null;
            let to_block: [number, number] = null;

            if (args[1]) {
                from_block = WorldEdit.parseBlockInfo(args[0]);
                to_block = WorldEdit.parseBlockInfo(args[1]);
            } else {
                to_block = WorldEdit.parseBlockInfo(args[0]);
            }

            let count: number = 0;
            const undo: SetHistoryObject = { blocks: [], set: to_block };
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();



            const pos1 = WorldEdit.getPosition(0);
            const pos2 = WorldEdit.getPosition(1);

            const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
            const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
            const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
            const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
            const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
            const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

            for (var x = start_x; x <= end_x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = start_y; y <= end_y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = start_z; z <= end_z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;

                        const tile = World.getBlock(x, y, z);

                        if (from_block) {
                            if (tile.id == from_block[0] && (from_block[1] == -1 || tile.data == from_block[1])) {
                                undo.blocks.push([x, y, z, tile.id, tile.data]);
                                World.setBlock(x, y, z, to_block[0], to_block[1]);
                                count++;
                            }
                        } else if (tile.id != 0) {
                            undo.blocks.push([x, y, z, tile.id, tile.data]);
                            World.setBlock(x, y, z, to_block[0], to_block[1]);
                            count++;
                        }
                    }
                }
            }
            WorldEdit.History.push("//replace", undo);

            Game.message(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        })
    },
    historyCall: function (action: WorldEdit.HistoryAction, data: any) {
        if (!data) return;
        const SetInfo: SetHistoryObject = (<SetHistoryObject>data);
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();
            const count = SetInfo.blocks.length;
            for (let i = 0; i < count; i++) {
                const block: [number, number, number, number, number] = SetInfo.blocks[i];
                switch (action) {
                    case WorldEdit.HistoryAction.UNDO:
                        world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                        break;
                    case WorldEdit.HistoryAction.REDO:
                        world.setBlock(block[0], block[1], block[2], SetInfo.set[0], SetInfo.set[1]);
                        break;
                }

            }
            Game.message(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});

/** Управление историей действий **/
Commands.register({
    name: "//undo",
    description: "Undo your last action.",
    args: "",
    call: function () {
        const undoInfo = WorldEdit.History.undo();
        if (undoInfo) {
            const command = Commands.get(undoInfo[0]);
            if (!command.historyCall) throw new Error("Unregister historyCall for " + undoInfo[0]);
            command.historyCall(WorldEdit.HistoryAction.UNDO, undoInfo[1]);
        }
    },
});
Commands.register({
    name: "//redo",
    description: "Redo your last (undone) action. This command replays back history and does not repeat the command.",
    args: "",
    call: function () {
        const redoInfo = WorldEdit.History.redo();
        if (redoInfo) {
            const command = Commands.get(redoInfo[0]);
            if (!command.historyCall) throw new Error("Unregister historyCall for " + redoInfo[0]);
            command.historyCall(WorldEdit.HistoryAction.REDO, redoInfo[1]);
        }
    },
});
Commands.register({
    name: "//clearhistory",
    description: "Clear your history.",
    args: "",
    call: function () {
        WorldEdit.History.clear();
        Game.message(Translation.translate("History cleared."));
    },
});


/** Other **/
Commands.register({
    name: "//r",
    description: "Work with the region.",
    args: "<type> [args]",
    call: function (args) {
        switch (args[0]) {
            case "help":
            case "?":
            case undefined:
                const list = [
                    ["help", "<page>", "Commands for working with the region"],
                    ["up", "<count>", "Raise the selected region by the specified number of blocks"],
                    ["down", "<count>", "Lower the selected region by the specified number of blocks"],
                    ["pos1", "[<x> <y> <z>]", Commands.get("//pos1").description],
                    ["pos2", "[<x> <y> <z>]", Commands.get("//pos2").description],
                ];

                var page = args[0] ? parseInt(args[0]) : 1;
                var _page = page - 1;
                var message = "";
                var count = 0;
                for (var i in list) {
                    count++;
                    if (count <= 6 * _page && count > 6 * page) continue;
                    var cmd = list[i];
                    message += "//region " + cmd[0] + " ";
                    if (cmd[1] != null)
                        message += cmd[1] + " ";
                    message += "- " + Translation.translate(cmd[2]) + "\n";
                }

                Game.message(
                    Translation.translate("===Help [Page %page%]===\n%cmd%===Help [Page %page%]===")
                        .replace(/(%page)/g, page.toString())
                        .replace("%cmd%", message)
                );
                break;
            case "up": {
                if (!args[1])
                    return Game.message(Translation.translate("Don't valid command."));

                if (!WorldEdit.checkValidPosition())
                    return Game.message(Translation.translate("Set both positions."));

                const up = parseInt(args[1]);
                if (isNaN(up))
                    return Game.message(Translation.translate("Don't valid command."));

                const pos1 = WorldEdit.getPosition(0);
                const pos2 = WorldEdit.getPosition(1);
                if (pos1.y > pos2.y) {
                    pos1.y += up;
                    WorldEdit.setPosition(0, pos1);
                } else {
                    pos2.y += up;
                    WorldEdit.setPosition(1, pos2);
                }

                Game.message(
                    Translation.translate("The region is raised to %area%")
                        .replace("%area%",
                            Translation.translate(__n(up, "%count% block.", "%count% blocks."))
                                .replace("%count%", up.toString())
                        )
                );

            } break;
            case "down": {
                if (!args[1])
                    return Game.message(Translation.translate("Don't valid command."));

                if (!WorldEdit.checkValidPosition())
                    return Game.message(Translation.translate("Set both positions."));

                const down = parseInt(args[1]);
                if (isNaN(down))
                    return Game.message(Translation.translate("Don't valid command."));

                const pos1 = WorldEdit.getPosition(0);
                const pos2 = WorldEdit.getPosition(1);
                if (pos1.y < pos2.y) {
                    pos1.y -= down;
                    WorldEdit.setPosition(0, pos1);
                } else {
                    pos2.y -= down;
                    WorldEdit.setPosition(1, pos2);
                }

                Game.message(
                    Translation.translate("The region is raised to %area%")
                        .replace("%area%",
                            Translation.translate(__n(down, "%count% block.", "%count% blocks."))
                                .replace("%count%", down.toString())
                        )
                );
            } break;
            case "pos1":
            case "pos2":
                const _args = args; _args.shift();
                Commands.invoke("//" + args[0], _args);
                break;
            default:
                return Game.message(Translation.translate("Don't valid command."));
        }
    }
});
Commands.register({
    name: "//reg",
    description: "Work with the region.",
    args: "<type> [args]",
    call: Commands.get("//r").call
});
Commands.register({
    name: "//region",
    description: "Work with the region.",
    args: "<type> [args]",
    call: Commands.get("//r").call
});
