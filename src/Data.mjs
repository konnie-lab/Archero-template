export default class Data {

    EVENTS = {
        // system
        ACTIVATE_PACK_SHOT: 'activate_pack_shot',
        OPEN_STORE: 'open_store',

        // game flow
        GAME_START: 'game_start',
        WAVE_START: 'wave_start',            // { wave }
        WAVE_CLEARED: 'wave_cleared',
        PLAYER_DIED: 'player_died',

        // spawning
        SPAWN_ENEMY: 'spawn_enemy',          // { type, position:{x,y,z}, wave }
        GAMEPLAY_PAUSE: 'gameplay_pause',
        GAMEPLAY_RESUME: 'gameplay_resume',
        WAVE_INTRO_START: 'wave_intro_start',
        WAVE_INTRO_END: 'wave_intro_end',

        // boosts
        SHOW_BOOSTS: 'show_boosts',          // { wave }
        BOOST_SELECTED: 'boost_selected',    // { key }
        BOOST_TIMEOUT_HINT: 'boost_timeout_hint',
        BOOST_AUTOSELECT: 'boost_autoselect',// { key }

        // combat
        HERO_CAN_ATTACK: 'hero_can_attack',
        HERO_CANNOT_ATTACK: 'hero_cannot_attack',
        PROJECTILE_HIT: 'projectile_hit',
        ENEMY_KILLED: 'enemy_killed',
        PLAYER_TAKE_DAMAGE: 'player_take_damage',
        SHOW_DAMAGE_NUMBER: 'show_damage_number',
    };

    SOUND_EVENTS = {
        START_MUSIC: 'start_music',
        STOP_MUSIC: 'stop_music',
    };

    // GAME CONFIG (  app.data.GAME_CONFIG )
    GAME_CONFIG = {
        hero: { hp: 300, dmg: 190, moveSpeed: 6 },

        enemy: {
            archer: { hp: 300, contactDmg: 50, arrowDmg: 60, roamTime: 2 , moveSpeed: 1.8 },
            melee: { hp: 400, contactDmg: 50, chargeCd: 3, telTime: 0.7, lungeSpeed: 10, moveSpeed: 2.2 },
        },
        enemyModels: { archer: 'hen', melee: 'hen', fallback: 'hen' },
        waves: {
            1: {
                enemies: [
                    { type: 'archer', position: { x: -3.0, z: -5.0 } },
                    { type: 'archer', position: { x: 0.0, z: -5.0 } },
                    { type: 'archer', position: { x: 3.0, z: -5.0 } },
                ]
            },
            2: {
                enemies: [
                    { type: 'melee', position: { x: -3, z: -3 } },
                    { type: 'melee', position: { x: 0, z: -3 } },
                    { type: 'melee', position: { x: 3.0, z: -3 } },
                    { type: 'archer', position: { x: 0.0, z: -5.0 } },
                ]
            },
        },

        boostsWave1: ['multishot', 'fire', 'ricochet'],
        boostsWave2: ['hammer', 'meteor', 'shuriken'],

        boostsTimeoutHintSec: 5,
        boostsAutoPickSec: 150,
        boostsAutoPickKey: 'fire',

        lootAttractDelaySec: 0.5,
        delayBeforeShowFail: 1,
    };
}