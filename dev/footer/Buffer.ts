type tBuffer = [number, number, number, number, number][];
var Buffer: tBuffer = [];

Commands.register({
    name: "//copy",
    description: "Copy the selected area.",
    args: "[-a]",
    call: function (args) {
        runOnMainThread(function () {
            const with_air = args.indexOf("-a") != -1 ? true : false;

            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            const pos1 = WorldEdit.getPosition(0);
            const pos2 = WorldEdit.getPosition(1);

            const end_x = pos1.x > pos2.x ? pos1.x : pos2.x;
            const start_x = pos1.x > pos2.x ? pos2.x : pos1.x;
            const end_y = pos1.y > pos2.y ? pos1.y : pos2.y;
            const start_y = pos1.y > pos2.y ? pos2.y : pos1.y;
            const end_z = pos1.z > pos2.z ? pos1.z : pos2.z;
            const start_z = pos1.z > pos2.z ? pos2.z : pos1.z;

            Buffer = [];

            for (let x = start_x; x <= end_x; x++) {
                for (let y = start_y; y <= end_y; y++) {
                    for (let z = start_z; z <= end_z; z++) {
                        const block = world.getBlock(x, y, z);
                        const coord = Player.getPosition();
                        coord.x = Math.round(coord.x);
                        coord.y = Math.round(coord.y);
                        coord.z = Math.round(coord.z);
                        if (block.id == 0 && with_air == false)
                            continue;
                        Buffer.push([coord.x - x, coord.y - y, coord.z - z, block.id, block.data]);
                    }
                }
            }

            Game.message(Translation.translate("Region copied."));
        });
    },
});
interface CutServerObject {
    pos: [Vector, Vector];
    with_air: 0 | 1
}
Commands.register<CutServerObject>({
    name: "//cut",
    description: "Cut the selected area.",
    args: "[-a]",
    server: function (client, data) {
        runOnMainThread(function () {
            const player = client.getPlayerUid();
            const world: BlockSource = BlockSource.getDefaultForActor(player);

            const Buffer: tBuffer = [];
            const undo: tBuffer = [];

            for (let x = data.pos[0].x; x <= data.pos[1].x; x++) {
                for (let y = data.pos[0].y; y <= data.pos[1].y; y++) {
                    for (let z = data.pos[0].z; z <= data.pos[1].z; z++) {
                        const block = world.getBlock(x, y, z);
                        const coord = Entity.getPosition(player);
                        coord.x = Math.round(coord.x);
                        coord.y = Math.round(coord.y);
                        coord.z = Math.round(coord.z);
                        if (block.id == 0 && data.with_air == 0)
                            continue;
                        Buffer.push([coord.x - x, coord.y - y, coord.z - z, block.id, block.data]);
                        undo.push([x, y, z, block.id, block.data]);
                        world.setBlock(x, y, z, 0, 0);
                    }
                }
            }

            client.sendMessage(Translation.translate("Region cut."));
            client.send("worldedit.sendbuffer", Buffer);
            WorldEdit.History.send(client, "//cut", undo);
        });
    },
    call: function (args) {
        const with_air = args.indexOf("-a") != -1 ? 1 : 0;

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
            with_air: with_air
        }
    },
    historyServer: function (client, action, data) {
        const l = data.length;
        const world = BlockSource.getDefaultForActor(client.getPlayerUid());
        for (let i = 0; i < l; i++) {
            const block = data[i];
            switch (action) {
                case HistoryAction.UNDO:
                    world.setBlock(block[0], block[1], block[2], block[3], block[4]);
                    break;
                case HistoryAction.REDO:
                    world.setBlock(block[0], block[1], block[2], 0, 0);
                    break;
            }
        }
    }
});
interface PasteHistoryObject {
    cut: tBuffer,
    paste: tBuffer
}
Commands.register<tBuffer>({
    name: "//paste",
    description: "Paste the copied area.",
    args: "",
    server: function (client, data) {
        const count = data.length;
        const player = client.getPlayerUid();
        const world: BlockSource = BlockSource.getDefaultForActor(player);
        const undo: PasteHistoryObject = {
            cut: [],
            paste: data
        }

        for (let i = 0; i < count; i++) {
            const coord = Entity.getPosition(player);
            coord.x = Math.round(coord.x);
            coord.y = Math.round(coord.y);
            coord.z = Math.round(coord.z);

            const x = coord.x - data[i][0];
            const y = coord.y - data[i][1];
            const z = coord.z - data[i][2];
            const tile = world.getBlock(x, y, z);
            world.setBlock(x, y, z, data[i][3], data[i][4]);
            undo.cut.push([x, y, z, tile.id, tile.data]);
        }

        client.sendMessage(
            Translation.translate(
                __n(count, "%count% block changed.", "%count% blocks changed.")
            ).replace("%count%", count.toString())
        );
        WorldEdit.History.send(client, "//paste", undo);
    },
    call: function () {
        const count = Buffer.length;
        if (count == 0) Game.message("Buffer empty");
        return Buffer;
    },
    historyServer:function(client, action, data:PasteHistoryObject){
        const l = data.cut.length;
        const world: BlockSource = BlockSource.getDefaultForActor(client.getPlayerUid());
        for(let i = 0; i < l; i++){
            const arr = action == HistoryAction.UNDO ? data.cut : data.paste;
            world.setBlock(arr[i][0], arr[i][1], arr[i][2], arr[i][3], arr[i][4]);
        }
    }
});

Network.addClientPacket("worldedit.sendbuffer", function (data: tBuffer) {
    if (WorldEdit.enabled()) Buffer = data;
});
