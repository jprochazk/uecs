
import { World } from "../src";
import Benchmark from "benchmark";

class PositionComponent {
    x = 0.0;
    y = 0.0;
}

class DirectionComponent {
    x = 0.0;
    y = 0.0;
}

class ComflabulationComponent {
    thingy = 0.0
    dingy = 0
    mingy = false
    stringy = ""
}

function MovementSystem(world: World, dt: number) {
    world.view(PositionComponent, DirectionComponent).each((entity, position, direction) => {
        position.x += direction.x * dt;
        position.y += direction.y * dt;
    });
}

function ComflabSystem(world: World) {
    world.view(ComflabulationComponent).each((entity, comflab) => {
        comflab.thingy *= 1.00001;
        comflab.mingy = !comflab.mingy;
        comflab.dingy++;
        comflab.stringy = comflab.dingy.toString();
    });
}

function num(min: number, max: number) {
    return min + 0.5 * (max - min);
}

function MoreComplexSystem(world: World) {
    world.view(PositionComponent, DirectionComponent, ComflabulationComponent)
        .each((entity, position, direction, comflab) => {
            const nums: number[] = [];
            for (let i = 0; i < comflab.dingy && i < 100; i++) {
                nums.push(i * comflab.thingy);
            }

            const sum = nums.reduce((acc, val) => acc + val);
            const product = nums.reduce((acc, val) => acc + val * 2);

            comflab.stringy = comflab.dingy.toString();

            if (comflab.dingy % 10000 == 0) {
                if (position.x > position.y) {
                    direction.x = num(0, 5);
                    direction.y = num(0, 10);
                } else {
                    direction.x = num(0, 10);
                    direction.y = num(0, 5);
                }
            }
        });
}

function Update(world: World) {
    MovementSystem(world, 1);
    ComflabSystem(world);
    MoreComplexSystem(world);
}

function Init() {
    const world = new World;
    for (let i = 0; i < 100; ++i) {
        const entity = world.create(new PositionComponent, new DirectionComponent);
        if (i % 3 === 0) world.emplace(entity, new ComflabulationComponent);
    }
    return world;
}

const suite = new Benchmark.Suite;

interface Context {
    [key: string]: any;
}

function bench<T extends Context>(
    name: string,
    setup: () => T,
    code: (context: T) => void
) {
    suite.add(name, code.bind(undefined, setup()));
}

bench(
    "big iteration test",
    function () {
        return {
            world: Init()
        }
    },
    function (context) {
        Update(context.world);
    }
)