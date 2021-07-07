//General
namespace WorldEdit {
    let vectors: Vector[] = [];
    let limit: number = -1;
    let enabled: boolean = true;

    export function setPosition(pos: number, point: Vector)
    export function setPosition(pos: number, point: Vector, invokeCallback: false);
    export function setPosition(pos: number, point: Vector, invokeCallback: boolean = true) {
        vectors[pos] = copyObject({}, point);
        if (invokeCallback !== false)
            Callback.invokeCallback("worldedit.set_position", pos, vectors[pos]);
    }
    Callback.addCallback("worldedit.set_position", function (pos: number) {
        Callback.invokeCallback("worldedit.set_position_" + pos, vectors[pos]);
    });

    export function getPosition(pos: number): Vector {
        if (vectors[pos].x != Infinity)
            return copyObject({}, vectors[pos]);

        for (let i = 0, l = vectors.length; i < l; i++)
            if (vectors[i].x != Infinity)
                return copyObject({}, vectors[i]);

        return null;
    }

    export function getSizeArea(): number {
        const pos1 = getPosition(0);
        const pos2 = getPosition(1);
        return (Math.abs(pos1.x - pos2.x) + 1) * (Math.abs(pos1.y - pos2.y) + 1) * (Math.abs(pos1.z - pos2.z) + 1);
    }

    export function checkValidPosition(): boolean {
        return getPosition(0).x != Infinity
    }

    export function checkValidLimit(_limit: number): boolean {
        return limit == -1 || _limit <= limit;
    }
    export function setLimit(_limit: number): void {
        limit = _limit;
    }

    export function clear(): void {
        const l = vectors.length;
        for (let i = 0; i < l; i++)
            setPosition(i, { x: Infinity, y: Infinity, z: Infinity });

        enableWand();
    }

    export function enabledWand(): boolean {
        return enabled;
    }
    export function enableWand(): void {
        enabled = true;
    }
    export function disableWand(): void {
        enabled = false;
    }
    export function toggleWand(): void {
        enabled = !enabled;
    }

    export function parseBlockInfo(info: string): [number, number] {
        const block = info.split(":");
        return [parseInt(block[0]), block[1] ? parseInt(block[1]) : 0];
    }
}

//History
namespace WorldEdit {

    type HistoryItem = [string, any];
    class HistoryStack {
        private list: HistoryItem[] = [];
        private index: number = 0;
        private count: number = 0;

        public push(cmd: HistoryItem): void;
        public push(cmd: string, data: any): void;
        public push(cmd: string | HistoryItem, data?: any): void {
            if (!Array.isArray(cmd))
                cmd = [cmd, data];

            this.list[this.index++] = cmd;
            this.count = this.index;
        }
        public undo(): HistoryItem {
            return this.list[--this.index];
        }
        public redo(): HistoryItem {
            if (this.count == this.index) return null;
            return this.list[this.index++];
        }
        public clear() {
            this.index = 0;
        };
    }

    export const History = new HistoryStack();
    export enum HistoryAction { UNDO, REDO };
}

//For commands
namespace WorldEdit {
    export const addCommand = Commands.register;
    export const getCommand = Commands.get;
    export const invokeCommand = Commands.invoke;
}



WorldEdit.setPosition(0, { x: Infinity, y: Infinity, z: Infinity }, false);
WorldEdit.setPosition(1, { x: Infinity, y: Infinity, z: Infinity }, false);

ModAPI.registerAPI("WorldEdit", WorldEdit);
