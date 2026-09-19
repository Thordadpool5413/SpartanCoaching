/**
 * Release-gate entry point for the catalog-wide native behavior suite.
 *
 * The implementation remains split into the focused rendered probes so Jest
 * can report calculator/media failures independently from the directory
 * contract probes.
 */
import "./catalog-rendered-probes.test";
import "./universal-search.test";
import "./production-screen-probes.test";