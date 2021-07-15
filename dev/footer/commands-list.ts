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
            const inPage = 6;
            let message: string = "";

            const commands = Object.values(Commands.getListCommands());
            const pages = Math.ceil(commands.length / inPage);
            let i = inPage * _page;
            let l = i + inPage;
            if (l > commands.length)
                l = commands.length;

            for (; i < l; i++) {
                const command = commands[i];
                message += command.name + " ";
                if (command.args != null) message += command.args + " ";
                message += "- " + Translation.translate(command.description) + "\n";
            }
            Game.message(
                Translation.translate("===Help [Page %page% of %pages%]===\n%cmd%===Help [Page %page% of %pages%]===")
                    .replace(/(%page%)/g, page + "")
                    .replace(/(%pages%)/g, pages + "")
                    .replace("%cmd%", message)
            );
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
    description: "Set the maximum number of <limit> blocks used for commands. Works for host only. Used to prevent catastrophic incidents.",
    args: "<limit>",
    call: function (args) {
        if(Network.inRemoteWorld())
            return Game.message(Translation.translate("You are not a host."));

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
interface SetServerData {
    pos: [Vector, Vector];
    block: [number, number]
}

Commands.register<SetServerData>({
    name: "//set",
    description: "Set all blocks inside the selection region to a specified block.",
    args: "<block>",
    server: function (client, data) {
        const undo: SetHistoryObject = {
            blocks: [],
            set: data.block
        };
        let count: number = 0;
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getDefaultForActor(client.getPlayerUid());

            for (var x = data.pos[0].x; x <= data.pos[1].x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = data.pos[0].y; y <= data.pos[1].y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = data.pos[0].z; z <= data.pos[1].z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;

                        const tile = world.getBlock(x, y, z);

                        undo.blocks.push([x, y, z, tile.id, tile.data]);
                        world.setBlock(x, y, z, data.block[0], data.block[1]);

                        count++;
                    }
                }
            }
            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
            WorldEdit.History.send(client, { command: "//set", data: undo });
        });
    },
    call: function (args) {
        if (!args[0])
            return Game.message(Translation.translate("Don't valid command."))

        if (!WorldEdit.checkValidPosition())
            return Game.message(Translation.translate("Set both positions."));


        const block = WorldEdit.parseBlockInfo(args[0]);
        const id: number = block[0];
        const data: number = block[1];

        const pos1 = WorldEdit.getPosition(0);
        const pos2 = WorldEdit.getPosition(1);

        const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
        const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
        const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
        const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
        const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
        const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

        return {
            pos: [
                { x: start_x, y: start_y, z: start_z },
                { x: end_x, y: end_y, z: end_z }
            ],
            block: [id, data]
        };
    },
    historyServer: function (client, action, data) {
        const SetInfo: SetHistoryObject = (<SetHistoryObject>data);
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getDefaultForActor(client.getPlayerUid());
            const count = SetInfo.blocks.length;
            for (let i = 0; i < count; i++) {
                const block: [number, number, number, number, number] = SetInfo.blocks[i];
                switch (action) {
                    case HistoryAction.UNDO:
                        world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                        break;
                    case HistoryAction.REDO:
                        world.setBlock(block[0], block[1], block[2], SetInfo.set[0], SetInfo.set[1]);
                        break;
                }

            }
            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});
interface ReplaceServerData extends SetServerData {
    pattern?: [number, number];
}
Commands.register<ReplaceServerData>({
    name: "//replace",
    description: "Replace all blocks of the specified block(s) with another block inside the region.",
    args: "[from_block] <to_block>",
    server: function (client, data) {
        runOnMainThread(function () {
            let count: number = 0;
            const undo: SetHistoryObject = { blocks: [], set: data.block };
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            for (var x = data.pos[0].x; x <= data.pos[1].x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = data.pos[0].y; y <= data.pos[1].y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = data.pos[0].z; z <= data.pos[1].z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;

                        const tile = World.getBlock(x, y, z);

                        if (data.pattern) {
                            if (tile.id == data.pattern[0] && (data.pattern[1] == -1 || tile.data == data.pattern[1])) {
                                undo.blocks.push([x, y, z, tile.id, tile.data]);
                                world.setBlock(x, y, z, data.block[0], data.block[1]);
                                count++;
                            }
                        } else if (tile.id != 0) {
                            undo.blocks.push([x, y, z, tile.id, tile.data]);
                            world.setBlock(x, y, z, data.block[0], data.block[1]);
                            count++;
                        }
                    }
                }
            }

            WorldEdit.History.send(client, { command: "//replace", data: undo });
            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        })
    },
    call: function (args) {
        if (!args[0])
            return Game.message(Translation.translate("Don't valid command."));

        if (!WorldEdit.checkValidPosition())
            return Game.message(Translation.translate("Set both positions."));


        let from_block: [number, number] = null;
        let to_block: [number, number] = null;

        if (args[1]) {
            from_block = WorldEdit.parseBlockInfo(args[0], -1);
            to_block = WorldEdit.parseBlockInfo(args[1]);
        } else {
            to_block = WorldEdit.parseBlockInfo(args[0]);
        }

        const pos1 = WorldEdit.getPosition(0);
        const pos2 = WorldEdit.getPosition(1);

        const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
        const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
        const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
        const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
        const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
        const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

        return {
            pos: [
                { x: start_x, y: start_y, z: start_z },
                { x: end_x, y: end_y, z: end_z }
            ],
            block: to_block,
            pattern: from_block
        }
    },
    historyServer: function (client, action, data) {
        const SetInfo: SetHistoryObject = (<SetHistoryObject>data);
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getDefaultForActor(client.getPlayerUid());
            const count = SetInfo.blocks.length;
            for (let i = 0; i < count; i++) {
                const block: [number, number, number, number, number] = SetInfo.blocks[i];
                switch (action) {
                    case HistoryAction.UNDO:
                        world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                        break;
                    case HistoryAction.REDO:
                        world.setBlock(block[0], block[1], block[2], SetInfo.set[0], SetInfo.set[1]);
                        break;
                }

            }
            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});
Commands.register<SetServerData>({
    name: "//box",
    description: "Build walls, floor, and ceiling.",
    args: "<block>",
    server: function (client, data) {
        runOnMainThread(function () {
            let count = 0;
            const undo: SetHistoryObject = { blocks: [], set: data.block };

            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            for (var x = data.pos[0].x; x <= data.pos[1].x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = data.pos[0].y; y <= data.pos[1].y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = data.pos[0].z; z <= data.pos[1].z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;


                        if (x == data.pos[0].x || x == data.pos[1].x || y == data.pos[0].y || y == data.pos[1].y || z == data.pos[0].z || z == data.pos[1].z) {
                            let tile = world.getBlock(x, y, z);

                            undo.blocks.push([x, y, z, tile.id, tile.data]);
                            world.setBlock(x, y, z, data.block[0], data.block[1]);

                            count++;
                        }
                    }
                }
            }

            WorldEdit.History.send(client, { command: "//box", data: undo });

            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    },
    call: function (args) {
        if (!args[0])
            return Game.message(Translation.translate("Don't valid command."));

        if (!WorldEdit.checkValidPosition())
            return Game.message(Translation.translate("Set both positions."));

        const block = WorldEdit.parseBlockInfo(args[0]);
        const id = block[0];
        const data = block[1];

        const pos1 = WorldEdit.getPosition(0);
        const pos2 = WorldEdit.getPosition(1);

        const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
        const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
        const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
        const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
        const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
        const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

        return {
            pos: [
                { x: start_x, y: start_y, z: start_z },
                { x: end_x, y: end_y, z: end_z }
            ],
            block: [id, data]
        }
    },
    historyServer: function (client, action, data) {
        const SetInfo: SetHistoryObject = (<SetHistoryObject>data);
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getDefaultForActor(client.getPlayerUid());
            const count = SetInfo.blocks.length;
            for (let i = 0; i < count; i++) {
                const block: [number, number, number, number, number] = SetInfo.blocks[i];
                switch (action) {
                    case HistoryAction.UNDO:
                        world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                        break;
                    case HistoryAction.REDO:
                        world.setBlock(block[0], block[1], block[2], SetInfo.set[0], SetInfo.set[1]);
                        break;
                }

            }
            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});
Commands.register<SetServerData>({
    name: "//walls",
    description: "Build walls, floor, and ceiling.",
    args: "<block>",
    server: function (client, data) {
        runOnMainThread(function () {
            let count = 0;
            const undo: SetHistoryObject = { blocks: [], set: data.block };

            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            for (var x = data.pos[0].x; x <= data.pos[1].x; x++) {
                if (!WorldEdit.checkValidLimit(count)) break;
                for (var y = data.pos[0].y; y <= data.pos[1].y; y++) {
                    if (!WorldEdit.checkValidLimit(count)) break;
                    for (var z = data.pos[0].z; z <= data.pos[1].z; z++) {
                        if (!WorldEdit.checkValidLimit(count)) break;


                        if (x == data.pos[0].x || x == data.pos[1].x || z == data.pos[0].z || z == data.pos[1].z) {
                            let tile = world.getBlock(x, y, z);

                            undo.blocks.push([x, y, z, tile.id, tile.data]);
                            world.setBlock(x, y, z, data.block[0], data.block[1]);

                            count++;
                        }
                    }
                }
            }

            WorldEdit.History.send(client, { command: "//wall", data: undo });

            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    },
    call: function (args) {
        if (!args[0])
            return Game.message(Translation.translate("Don't valid command."));

        if (!WorldEdit.checkValidPosition())
            return Game.message(Translation.translate("Set both positions."));

        const block = WorldEdit.parseBlockInfo(args[0]);
        const id = block[0];
        const data = block[1];

        const pos1 = WorldEdit.getPosition(0);
        const pos2 = WorldEdit.getPosition(1);

        const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
        const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
        const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
        const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
        const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
        const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

        return {
            pos: [
                { x: start_x, y: start_y, z: start_z },
                { x: end_x, y: end_y, z: end_z }
            ],
            block: [id, data]
        }
    },
    historyServer: function (client, action, data) {
        const SetInfo: SetHistoryObject = (<SetHistoryObject>data);
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getDefaultForActor(client.getPlayerUid());
            const count = SetInfo.blocks.length;
            for (let i = 0; i < count; i++) {
                const block: [number, number, number, number, number] = SetInfo.blocks[i];
                switch (action) {
                    case HistoryAction.UNDO:
                        world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                        break;
                    case HistoryAction.REDO:
                        world.setBlock(block[0], block[1], block[2], SetInfo.set[0], SetInfo.set[1]);
                        break;
                }

            }
            client.sendMessage(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});

/** Управление историей действий **/
interface HistoryServerData<T = any> {
    command: string;
    action: HistoryAction;
    data: T;
}
Commands.register<HistoryServerData>({
    name: "//undo",
    description: "Undo your last action.",
    args: "",
    server: function (client, data) {
        const command = <Commands.ServerInfo>Commands.get(data.command);
        command.historyServer(client, data.action, data.data);
    },
    call: function () {
        const undoInfo = WorldEdit.History.undo();

        if (!undoInfo) return Game.message(Translation.translate("There is nothing to undo."));

        const command = <Commands.ServerInfo>Commands.get(undoInfo[0]);

        if (!command.historyCall && !command.historyServer) throw new Error("Unregister historyCall for " + undoInfo[0]);
        if (command.historyCall)
            return {
                command: command.name,
                action: HistoryAction.UNDO,
                data: command.historyCall(HistoryAction.UNDO, undoInfo[1])
            }
        else
            return {
                command: command.name,
                action: HistoryAction.UNDO,
                data: undoInfo[1]
            }
    },
});
Commands.register<HistoryServerData>({
    name: "//redo",
    description: "Redo your last (undone) action. This command replays back history and does not repeat the command.",
    args: "",
    server: (<Commands.ServerInfo>Commands.get("//undo")).server,
    call: function () {
        const redoInfo = WorldEdit.History.redo();

        if (!redoInfo) return Game.message(Translation.translate("There is nothing to undo."));

        const command = <Commands.ServerInfo>Commands.get(redoInfo[0]);

        if (!command.historyCall && !command.historyServer) throw new Error("Unregister historyCall for " + redoInfo[0]);
        if (command.historyCall)
            return {
                command: command.name,
                action: HistoryAction.REDO,
                data: command.historyCall(HistoryAction.REDO, redoInfo[1])
            }
        else
            return {
                command: command.name,
                action: HistoryAction.REDO,
                data: redoInfo[1]
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
