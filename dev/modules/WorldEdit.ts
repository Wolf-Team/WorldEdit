//General
namespace WorldEdit {
    let vectors: Vector[] = [];
    let limit: number = -1;
    let enabled: boolean = true;

    export function setPosition(pos: number, point: Vector) {
        if (point.x != Infinity && point.y != Infinity && point.z != Infinity)
            for (let i in vectors)
                if (Math.abs(vectors[i].x) == Infinity)
                    vectors[i] = copyObject({}, point);

        vectors[pos] = copyObject({}, point);
    }
    export function getPosition(pos: number): Vector {
        return copyObject({}, vectors[pos]);
    }

    export function getSizeArea(): number {
        const pos1 = vectors[0];
        const pos2 = vectors[1];
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

    setPosition(0, { x: Infinity, y: Infinity, z: Infinity });
    setPosition(1, { x: Infinity, y: Infinity, z: Infinity });
}

//For commands
namespace WorldEdit {
    export const addCommand = Commands.register;
    export const getCommand = Commands.get;
    export const invokeCommand = Commands.invoke;
}

ModAPI.registerAPI("WorldEdit", WorldEdit);
