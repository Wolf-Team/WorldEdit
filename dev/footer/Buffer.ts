var Buffer: [number, number, number, Tile][] = [];

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
                        Buffer.push([coord.x - x, coord.y - y, coord.z - z, block]);
                    }
                }
            }

            Game.message(Translation.translate("Region copied."));
        });
    },
});
Commands.register({
    name: "//cut",
    description: "Cut the selected area.",
    args: "[-a]",
    call: function (args) {
        runOnMainThread(function () {
            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            const with_air = args.indexOf("-a") != -1 ? true : false;

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
                        Buffer.push([coord.x - x, coord.y - y, coord.z - z, block]);
                        world.setBlock(x, y, z, 0, 0);
                    }
                }
            }

            Game.message(Translation.translate("Region copied."));
        });
    }
});
Commands.register({
    name: "//paste",
    description: "Paste the copied area.",
    args: "",
    call: function () {
        const count = Buffer.length;
        if (count == 0) Game.message("Buffer empty");
        runOnMainThread(function () {

            const world: BlockSource = BlockSource.getCurrentWorldGenRegion();

            for (let i = 0; i < count; i++) {
                const coord = Player.getPosition();
                coord.x = Math.round(coord.x);
                coord.y = Math.round(coord.y);
                coord.z = Math.round(coord.z);
                world.setBlock(coord.x - Buffer[i][0],
                    coord.y - Buffer[i][1],
                    coord.z - Buffer[i][2], Buffer[i][3].id, Buffer[i][3].data);
            }

            Game.message(
                Translation.translate(
                    __n(count, "%count% block changed.", "%count% blocks changed.")
                ).replace("%count%", count.toString())
            );
        });
    }
});
