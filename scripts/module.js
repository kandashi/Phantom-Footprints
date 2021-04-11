import ImagePicker from "./ImagePicker.js";

Hooks.on('init', async function () {
    game.settings.register("Phantom-Footprints", "footstep-Step", {
        name: game.i18n.format("Phantom-Footprints.step_name"),
        hint: game.i18n.format("Phantom-Footprints.step_hint"),
        scope: 'world',
        type: String,
        default: "3",
        config: true,
    });
    game.settings.register("Phantom-Footprints", "footstep-MaxRadius", {
        name: game.i18n.format("Phantom-Footprints.maxRadius_name"),
        hint: game.i18n.format("Phantom-Footprints.maxRadius_hint"),
        scope: 'world',
        type: String,
        default: "4",
        config: true,
    });
    game.settings.register("Phantom-Footprints", "footstep-MinRadius", {
        name: game.i18n.format("Phantom-Footprints.minRadius_name"),
        hint: game.i18n.format("Phantom-Footprints.minRadius_hint"),
        scope: 'world',
        type: String,
        default: "1",
        config: true,
    });
    game.settings.register("Phantom-Footprints", "footstep-maxIcon", {
        name: game.i18n.format("Phantom-Footprints.maxIcon_name"),
        hint: game.i18n.format("Phantom-Footprints.maxIcon_hint"),
        scope: 'world',
        type: String,
        default: "4",
        config: true,
    });
    game.settings.register("Phantom-Footprints", "footstep-marker", {
        name: game.i18n.format("Phantom-Footprints.marker_name"),
        scope: 'world',
        type: ImagePicker.Image,
        default: "[data] modules/Phantom-Footprints/Images/Shoe_FootStep_200x200.webm",
        config: true,
        onChange: () => { window.location.reload() }
    });
    game.settings.register("Phantom-Footprints", "ping-marker", {
        name: game.i18n.format("Phantom-Footprints.marker_name"),
        scope: 'world',
        type: ImagePicker.Image,
        default: "[data] modules/jb2a_patreon/Library/TMFX/OutPulse/Circle/OutPulse_01_Circle_Normal_500.webm",
        config: true,
        onChange: () => { window.location.reload() }
    });
    game.settings.register("Phantom-Footprints", "decayTime", {
        name: game.i18n.format("Phantom-Footprints.decayTime_name"),
        hint: game.i18n.format("Phantom-Footprints.decayTime_hint"),
        scope: 'world',
        type: String,
        default: "60",
        config: true,
        onChange: () => { window.location.reload() }
    });
    game.settings.register("Phantom-Footprints", "minPerDif", {
        name: game.i18n.format("Phantom-Footprints.minPerDif_name"),
        hint: game.i18n.format("Phantom-Footprints.minPerDif_hint"),
        scope: 'world',
        type: String,
        default: "3",
        config: true,
        onChange: () => { window.location.reload() }
    });
    game.settings.register("Phantom-Footprints", "blindSight", {
        name: game.i18n.format("Phantom-Footprints.blindSight_name"),
        hint: game.i18n.format("Phantom-Footprints.blindSight_hint"),
        scope: 'world',
        type: Boolean,
        default: false,
        config: true,
        onChange: () => { window.location.reload() }
    });
    game.settings.register("Phantom-Footprints", "checkArea", {
        name: game.i18n.format("Phantom-Footprints.checkArea_name"),
        hint: game.i18n.format("Phantom-Footprints.checkArea_hint"),
        scope: 'world',
        type: String,
        default: "30",
        config: true,
        onChange: () => { window.location.reload() }
    });
});

Hooks.once('ready', async function () {

});

Hooks.on("updateToken", (_scene, token, update) => {
    if (!(getProperty(update, "x") || getProperty(update, "y"))) return;
    PF.PlaceFootprint(token)
})

const StepArray = []
let PreviousTile;

while (StepArray.length > 0) {
    let time = PF.maxTime * 1000 / StepArray.length
    await new Promise(resolve => setTimeout(resolve, time))
    PF.RemoveFootprint()
}

class PF {

    static PFSetup() {
        this.assignedActor = game.actors.get(game.user.data.character)
        this.assignedToken = this.assignedActor.getActiveTokens()[0]
        this.maxIcons = parseInt(game.settings.get("Phantom-Footprints", "footstep-maxIcon"))
        this.maxSteps = parseInt(game.settings.get("Phantom-Footprints", "footstep-MaxRadius"))
        this.minSteps = parseInt(game.settings.get("Phantom-Footprints", "footstep-MinRadius"))
        this.maxTime = parseInt(game.settings.get("Phantom-Footprints", "decayTime"))
        this.footStep = parseInt(game.settings.get("Phantom-Footprints", "footstep-Step"));
        this.FootTexturePath = game.settings.get("Phantom-Footprints", "footstep-marker").substring(7)
        this.PingTexturePath = game.settings.get("Phantom-Footprints", "ping-marker").substring(7)
        this.MinDif = parseInt(game.settings.get("Phantom-Footprints", "minPerDif"))
        this.BlindSight = game.settings.get("Phantom-Footprints", "blindSight")
        this.BlindRadius = parseInt(this.assignedActor.data.data.attributes.senses.blindsight)
        this.StandardRadius = parseInt(game.settings.get("Phantom-Footprints", "checkArea"))
    }

    static Clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }


    static async CheckPlacement() {
        if (this.BlindSight && (this.comparedDistance < this.BlindRadius)) {
            return this.StepLevel = 0
            
        }
        if (this.comparedDistance > this.StandardRadius) {
            return false
        }
        this.PerDif = this.assignedActor.data.data.skills.prc.passive - this.token.actor.data.data.skills.ste.passive
        if (this.PerDif - this.MinDif < 0) return false;
        return this.StepLevel = Math.min(this.maxSteps - parseInt(this.PerDif / this.footStep), this.minSteps)
        
    }

    static CreateRay() {
        const degAngle = 360 / (Math.random() * 15)
        const RayAngle = degAngle * (180 / Math.PI)
        const distance = this.StepLevel * canvas.dimensions.size
        return Ray.fromAngle(this.position.x, this.position.y, RayAngle, distance)
    }

    static async SelectTile() {
        this.PFRay = await PF.CreateRay()
        const collisions = WallsLayer.getRayCollisions(this.PFRay, { mode: "closest" })
        if (collisions) this.tile = canvas.grid.getCenter(collisions.x, collisions.y)
        else this.tile = canvas.grid.getCenter(this.PFRay.B.x, this.PFRay.B.y)
    }

    static WalkDirection() {
        const oldPos = !!PreviousTile ? { x: PreviousTile[0], y: PreviousTile[1] } : { x: 0, y: 0 }
        const newPos = this.position
        const oldRay = new Ray(oldPos, newPos)
        return oldRay.angle
    }

    static async PlaceFootprint(token) {
        PF.PFSetup()
        this.token = canvas.tokens.get(token._id);
        this.position = { x: token.x, y: token.y }
        this.comparedDistance = canvas.grid.measureDistance(this.token, this.assignedToken)
        if(!await this.CheckPlacement()) return;
        this.Sprite = await this.CreateSprite()
        if (this.token.isVisible && !this.token.data.hidden) return;
        this.step = canvas.effects.addChild(this.Sprite)
        await this.SelectTile()
        this.step.position.set(this.tile[0], this.tile[1])
        if (!this.token.isVisible) this.step.tint = 13238272
        this.step.rotation = this.WalkDirection()
        canvas.effects.sortableChildren = true
        this.step.zIndex = 100000
        const source = getProperty(this.step._texture, "baseTexture.resource.source")
        if (source && (source.tagName === "VIDEO")) {
            source.loop = true;
            source.muted = true;
            game.video.play(source);
        }
        this.SetArray()
        PreviousTile = duplicate(this.tile)
    }

    static async CreateSprite() {

        const texture = this.token.isVisible ? await loadTexture(PF.FootTexturePath) : this.token.data.hidden ? await loadTexture(PF.FootTexturePath) : await loadTexture(PF.PingTexturePath)
        const gs = canvas.grid.size
        texture.orig = { height: gs, width: gs, x: gs / 2, y: gs / 2 };
        return new PIXI.Sprite(texture)
    }

    static SetArray() {
        StepArray.push(this.step)
        if (StepArray.length > this.maxIcons) {
            this.RemoveFootprint()
        }
    }

    static RemoveFootprint() {
        const oldIcon = StepArray[0]
        oldIcon.destroy()
        StepArray.splice(0, 1)
    }

    static ClearAllFootprints() {
        for (let step of StepArray) {
            step.destroy()
        }
        StepArray.length = 0
    }


}