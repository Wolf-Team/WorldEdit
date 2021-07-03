Callback.addCallback("ItemUse", function (coords, item, block) {
    if (item.id == wand_id && WorldEdit.enabledWand()) {
        Commands.invoke("//pos1", [coords.x.toString(), coords.y.toString(), coords.z.toString()]);
        Game.prevent();
    }
});

Callback.addCallback("DestroyBlock", function (coords) {
    if (Game.getGameMode() == 1 && Player.getCarriedItem().id == wand_id && WorldEdit.enabledWand()) {
        Commands.invoke("//pos2", [coords.x.toString(), coords.y.toString(), coords.z.toString()]);
        Game.prevent();
    }
});
Callback.addCallback("DestroyBlockStart", function (coords, block, player) {
    if (Game.getGameMode() == 0 && Player.getCarriedItem().id == wand_id && WorldEdit.enabledWand()) {
        Commands.invoke("//pos2", [coords.x.toString(), coords.y.toString(), coords.z.toString()]);
        Game.prevent();
    }
});


Callback.addCallback("LevelLeft", function(){
    WorldEdit.clear();
});
