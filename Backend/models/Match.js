const mongoose = require('mongoose');

const batsmanSchema = new mongoose.Schema({
  name:   { type: String, default: '' },
  runs:   { type: Number, default: 0 },
  balls:  { type: Number, default: 0 },
  fours:  { type: Number, default: 0 },
  sixes:  { type: Number, default: 0 },
  out:    { type: Boolean, default: false },
  howOut: { type: String, default: '' },
});

const bowlerSchema = new mongoose.Schema({
  name:    { type: String, default: '' },
  overs:   { type: Number, default: 0 },
  balls:   { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  runs:    { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
});

const inningsSchema = new mongoose.Schema({
  runs:         { type: Number, default: 0 },
  wickets:      { type: Number, default: 0 },
  balls:        { type: Number, default: 0 },
  extras: {
    wide: { type: Number, default: 0 },
    nb:   { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    lb:   { type: Number, default: 0 },
  },
  batsmen:      { type: [batsmanSchema], default: [] },
  bowlers:      { type: [bowlerSchema],  default: [] },
  overs:        { type: [{ runs: Number, balls: [String] }], default: [] },
  activeBat:    { type: [Number], default: [0, 1] },
  activeBowler: { type: Number,   default: 0 },
});

const matchSchema = new mongoose.Schema(
  {
    date:  { type: String, default: '' },
    time:  { type: String, default: '' },
    team1: { type: String, required: true },
    team2: { type: String, required: true },

    inn1: { type: inningsSchema, default: () => ({}) },
    inn2: { type: inningsSchema, default: () => ({}) },

    status:      { type: String, default: 'In Progress' },
    battingTeam: { type: String, default: 'team1' },
    inning:      { type: Number, default: 1 },
    currentOver: { type: [String], default: [] },

    matchConfig: {
      overs:          { type: Number, default: 8 },
      playersPerTeam: { type: Number, default: 11 },
      noBallRun:      { type: Number, default: 1 },
      wideBallRun:    { type: Number, default: 1 },
      team1:          { type: String, default: '' },
      team2:          { type: String, default: '' },
      tossWon:        { type: String, default: 'team1' },
      optedTo:        { type: String, default: 'bat' },
    },
    manOfTheMatch: {
      name:          { type: String, default: '' },
      team:          { type: String, default: '' },
      role:          { type: String, default: '' },
      runs:          { type: Number, default: 0 },
      balls:         { type: Number, default: 0 },
      fours:         { type: Number, default: 0 },
      sixes:         { type: Number, default: 0 },
      wickets:       { type: Number, default: 0 },
      overs:         { type: Number, default: 0 },
      maidens:       { type: Number, default: 0 },
      runsConceded:  { type: Number, default: 0 },
      strikeRate:    { type: String, default: '' },
      economy:       { type: String, default: '' },
      summary:       { type: String, default: '' },
      performanceScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
