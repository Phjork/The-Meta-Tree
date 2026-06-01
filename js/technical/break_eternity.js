//Author: dlsdl v1.0
//rewritten and add even more hyper operations
//Code snippets and templates from OmegaNum.js

;(function (globalScope) {
  "use strict";

  var Decimal = {
    maxRows: 100,
    maxCols: 100,
    maxArrow: Number.MAX_SAFE_INTEGER,
    serializeMode: 0,
    debug: 0
  },

  external = true,

  DecimalError = "[DecimalError] ",
  invalidArgument = DecimalError + "Invalid argument: ",

  MAX_SAFE_INTEGER = 9007199254740991,
  MAX_E = Math.log10(MAX_SAFE_INTEGER),

  P = {},
  Q = {},
  R = {};

  R.ZERO = 0;
  R.ONE = 1;
  R.TWO = 2;
  R.TEN = 10;
  R.E = Math.E;
  R.LN2 = Math.LN2;
  R.LN10 = Math.LN10;
  R.LOG2E = Math.LOG2E;
  R.LOG10E = Math.LOG10E;
  R.PI = Math.PI;
  R.SQRT1_2 = Math.SQRT1_2;
  R.SQRT2 = Math.SQRT2;
  R.MAX_SAFE_INTEGER = MAX_SAFE_INTEGER;
  R.MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
  R.NaN = NaN;
  R.POSITIVE_INFINITY = Infinity;
  R.NEGATIVE_INFINITY = -Infinity;
  R.E_MAX_SAFE_INTEGER = "E" + MAX_SAFE_INTEGER;
  R.EE_MAX_SAFE_INTEGER = "EE" + MAX_SAFE_INTEGER;
  R.TETRATED_MAX_SAFE_INTEGER = "F" + MAX_SAFE_INTEGER;
  R.PENTATED_MAX_SAFE_INTEGER = "G" + MAX_SAFE_INTEGER;
  R.TRITRI = "[[3638334640023.7783, 7625597484984]]";
  R.GRAHAMS_NUMBER = "[[3638334640023.7783, 7625597484984, 0, 1],[63,0,1]]";//对3↑↑↑↑3(≈GE^7625597484984 3638334640023.7783)做63次ω级运算
  R.QqQe308 = "QqQe308";

  function cmpArr(a, b) {
    var al = a.length;
    while (al > 0 && a[al - 1] === 0) al--;
    var bl = b.length;
    while (bl > 0 && b[bl - 1] === 0) bl--;
    if (al !== bl) return al > bl ? 1 : -1;
    for (var i = al - 1; i >= 0; i--) {
      if (a[i] > b[i]) return 1;
      if (a[i] < b[i]) return -1;
    }
    return 0;
  }

  function isZeroArr(arr) {
    if (!arr || arr.length === 0) return true;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] !== 0) return false;
    }
    return true;
  }

  function deepCloneArray(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      result[i] = arr[i].slice(0);
    }
    return result;
  }

  var debugMessageSent = false;

  var f_gamma = function (n) {
    if (!isFinite(n)) return n;
    if (n < -50) {
      if (n == Math.trunc(n)) return Number.NEGATIVE_INFINITY;
      return 0;
    }
    var scal1 = 1;
    while (n < 10) {
      scal1 = scal1 * n;
      ++n;
    }
    n -= 1;
    var l = 0.9189385332046727;
    l += (n + 0.5) * Math.log(n);
    l -= n;
    var n2 = n * n;
    var np = n;
    l += 1 / (12 * np);
    np *= n2;
    l -= 1 / (360 * np);
    np *= n2;
    l += 1 / (1260 * np);
    np *= n2;
    l -= 1 / (1680 * np);
    np *= n2;
    l += 1 / (1188 * np);
    np *= n2;
    l -= 691 / (360360 * np);
    np *= n2;
    l += 7 / (1092 * np);
    np *= n2;
    l -= 3617 / (122400 * np);
    return Math.exp(l) / scal1;
  };

  var OMEGA = 0.56714329040978387299997;

  var f_lambertw = function (z, tol, principal) {
    if (tol === undefined) tol = 1e-10;
    if (principal === undefined) principal = true;
    var w;
    if (!Number.isFinite(z)) return z;
    if (principal) {
      if (z === 0) return z;
      if (z === 1) return OMEGA;
      if (z < 10) w = 0;
      else w = Math.log(z) - Math.log(Math.log(z));
    } else {
      if (z === 0) return -Infinity;
      if (z <= -0.1) w = -2;
      else w = Math.log(-z) - Math.log(-Math.log(-z));
    }
    for (var i = 0; i < 100; ++i) {
      var wn = (z * Math.exp(-w) + w * w) / (w + 1);
      if (Math.abs(wn - w) < tol * Math.abs(wn)) return wn;
      w = wn;
    }
    throw Error("Iteration failed to converge: " + z);
  };

  var d_lambertw = function (z, tol, principal) {
    if (tol === undefined) tol = 1e-10;
    if (principal === undefined) principal = true;
    z = new Decimal(z);
    var w;
    if (!z.isFinite()) return z;
    if (principal) {
      if (z.eq(Decimal.ZERO)) return z;
      if (z.eq(Decimal.ONE)) return new Decimal(OMEGA);
      w = Decimal.ln(z);
    } else {
      if (z.eq(Decimal.ZERO)) return Decimal.NEGATIVE_INFINITY.clone();
      w = Decimal.ln(z.neg());
    }
    for (var i = 0; i < 100; ++i) {
      var ew = w.neg().exp();
      var wewz = w.sub(z.mul(ew));
      var dd = w.add(Decimal.ONE).sub(w.add(2).mul(wewz).div(Decimal.mul(2, w).add(2)));
      if (dd.eq(Decimal.ZERO)) return w;
      var wn = w.sub(wewz.div(dd));
      if (Decimal.abs(wn.sub(w)).lt(Decimal.abs(wn).mul(tol))) return wn;
      w = wn;
    }
    throw Error("Iteration failed to converge: " + z);
  };

  var decimalPlaces = function (value, places) {
    var len = places + 1;
    var numDigits = Math.ceil(Math.log10(Math.abs(value)));
    if (numDigits < 100) numDigits = 0;
    var rounded = Math.round(value * Math.pow(10, len - numDigits)) * Math.pow(10, numDigits - len);
    return parseFloat(rounded.toFixed(Math.max(len - numDigits, 0)));
  };

  var log10PosBigInt = function (input) {
    var exp = BigInt(64);
    while (input >= BigInt(1) << exp) exp *= BigInt(2);
    var expdel = exp / BigInt(2);
    while (expdel > BigInt(0)) {
      if (input >= BigInt(1) << exp) exp += expdel;
      else exp -= expdel;
      expdel /= BigInt(2);
    }
    var cutbits = exp - BigInt(54);
    var firstbits = input >> cutbits;
    return Math.log10(Number(firstbits)) + Math.LOG10E / Math.LOG2E * Number(cutbits);
  };

  var LONG_STRING_MIN_LENGTH = 17;

  var log10LongString = function (str) {
    return Math.log10(Number(str.substring(0, LONG_STRING_MIN_LENGTH))) + (str.length - LONG_STRING_MIN_LENGTH);
  };

  P.normalize = function () {
    var b;
    var x = this;

    if (!x.array || !Array.isArray(x.array) || x.array.length === 0) {
      x.array = [[0]];
    }
    if (x.sign !== 1 && x.sign !== -1) {
      x.sign = Number(x.sign) < 0 ? -1 : 1;
    }
    if (typeof x.layer !== 'number' || !isFinite(x.layer) || x.layer < 0) {
      x.layer = 0;
    }
    x.layer = Math.floor(x.layer);

    for (var i = 0; i < x.array.length; i++) {
      if (!Array.isArray(x.array[i])) {
        x.array[i] = [x.array[i]];
      }
    }

    if (x.array[0] && x.array[0].length > 0) {
      if (isNaN(x.array[0][0])) {
        x.array = [[NaN]];
        x.layer = 0;
        return x;
      }
      if (!isFinite(x.array[0][0])) {
        x.array = [[x.array[0][0] === Infinity ? Infinity : -Infinity]];
        x.layer = 0;
        return x;
      }
    }

    var r0 = x.array[0];
    for (var i = 0; i < r0.length; i++) {
      if (r0[i] === null || r0[i] === undefined) {
        r0[i] = 0;
        continue;
      }
      if (i !== 0 && !Number.isInteger(r0[i])) r0[i] = Math.floor(r0[i]);
    }

    do {
      b = false;

      while (r0.length > 1 && r0[r0.length - 1] === 0) {
        r0.pop();
        b = true;
      }

      if (x.layer === 0 && r0[0] > MAX_SAFE_INTEGER) {
        r0[1] = (r0[1] || 0) + 1;
        r0[0] = Math.log10(r0[0]);
        b = true;
      }

      while (x.layer === 0 && r0.length > 1 && r0[0] < MAX_E && r0[1]) {
        r0[0] = Math.pow(10, r0[0]);
        r0[1]--;
        b = true;
      }

      for (var i = 1; i < r0.length; i++) {
        if (r0[i] > MAX_SAFE_INTEGER) {
          r0[i + 1] = (r0[i + 1] || 0) + 1;
          r0[0] = r0[i] + 1;
          for (var j = 1; j <= i; j++) r0[j] = 0;
          b = true;
        }
      }

      while (x.array.length > 1 && isZeroArr(x.array[x.array.length - 1])) {
        x.array.pop();
        b = true;
      }

      if (x.array.length > Decimal.maxRows) {
        x.array = x.array.slice(0, Decimal.maxRows);
        b = true;
      }

      for (var i = 0; i < x.array.length; i++) {
        if (x.array[i].length > Decimal.maxCols) {
          x.array[i] = x.array[i].slice(0, Decimal.maxCols);
          b = true;
        }
      }

      if (x.array.length === 0) {
        x.array = [[0]];
        b = true;
      }

      for (var i = 0; i < x.array.length; i++) {
        for (var j = 0; j < x.array[i].length; j++) {
          if (x.array[i][j] === null || x.array[i][j] === undefined) {
            x.array[i][j] = 0;
            b = true;
          }
          if ((i > 0 || j > 0) && (!isFinite(x.array[i][j]) || isNaN(x.array[i][j]))) {
            x.array[i][j] = 0;
            b = true;
          }
        }
      }

      for (var i = 1; i < x.array.length; i++) {
        var row = x.array[i];
        while (row.length > 0 && row[row.length - 1] === 0) {
          row.pop();
          b = true;
        }
      }

      if (x.array.length > 2) {
        var rows2plus = x.array.slice(1);
        rows2plus.sort(function (a, b) { return cmpArr(a, b); });
        var orderChanged = false;
        for (var i = 0; i < rows2plus.length; i++) {
          if (cmpArr(rows2plus[i], x.array[i + 1]) !== 0) {
            orderChanged = true;
            break;
          }
        }
        if (orderChanged) {
          for (var i = 0; i < rows2plus.length; i++) {
            x.array[i + 1] = rows2plus[i].slice(0);
          }
          b = true;
        }
      }

      for (var i = x.array.length - 1; i > 1; i--) {
        var rowA = x.array[i];
        var rowB = x.array[i - 1];
        if (rowA.length === rowB.length && rowA.length >= 2) {
          var same = true;
          for (var k = 1; k < rowA.length; k++) {
            if (rowA[k] !== rowB[k]) { same = false; break; }
          }
          if (same) {
            rowB[0] += rowA[0];
            x.array.splice(i, 1);
            b = true;
          }
        }
      }

    } while (b);

    if (!x.array.length || !x.array[0]) {
      x.array = [[0]];
      x.sign = 1;
    }

    if (x.array.length === 1 && x.array[0].length === 1 && x.array[0][0] === 0 && x.sign === -1) {
      x.sign = 1;
    }

    return x;
  };

  var standardizeMessageSent = false;
  P.standardize = function () {
    if (!standardizeMessageSent) console.warn(DecimalError + "'standardize' method is being deprecated in favor of 'normalize' and will be removed in the future!"), standardizeMessageSent = true;
    return this.normalize();
  };

  P.absoluteValue = P.abs = function () {
    var x = this.clone();
    x.sign = 1;
    return x;
  };
  Q.absoluteValue = Q.abs = function (x) {
    return new Decimal(x).abs();
  };

  P.negate = P.neg = function () {
    var x = this.clone();
    x.sign = x.sign * -1;
    return x.normalize();
  };
  Q.negate = Q.neg = function (x) {
    return new Decimal(x).neg();
  };

  P.compareTo = P.cmp = function (other) {
    if (!(other instanceof Decimal)) other = new Decimal(other);

    if (this.array[0] && isNaN(this.array[0][0])) return NaN;
    if (other.array[0] && isNaN(other.array[0][0])) return NaN;

    var tInf = this.array[0] && this.array[0][0] === Infinity;
    var oInf = other.array[0] && other.array[0][0] === Infinity;

    if (tInf && !oInf) return this.sign;
    if (!tInf && oInf) return -other.sign;
    if (tInf && oInf) {
      if (this.sign !== other.sign) return this.sign;
      return 0;
    }

    var tAllZero = (this.array.length === 1 && this.array[0].length === 1 && this.array[0][0] === 0);
    var oAllZero = (other.array.length === 1 && other.array[0].length === 1 && other.array[0][0] === 0);
    if (tAllZero && oAllZero) return 0;

    if (this.sign !== other.sign) return this.sign;

    var m = this.sign;

    if (this.layer !== other.layer) {
      return (this.layer > other.layer ? 1 : -1) * m;
    }

    var tRows = this.array.length;
    var oRows = other.array.length;
    while (tRows > 1 && isZeroArr(this.array[tRows - 1])) tRows--;
    while (oRows > 1 && isZeroArr(other.array[oRows - 1])) oRows--;

    if (tRows !== oRows) return (tRows > oRows ? 1 : -1) * m;

    for (var i = tRows - 1; i >= 0; i--) {
      var c = cmpArr(this.array[i], other.array[i]);
      if (c !== 0) return c * m;
    }

    return 0;
  };
  Q.compare = Q.cmp = function (x, y) {
    return new Decimal(x).cmp(y);
  };

  P.greaterThan = P.gt = function (other) {
    return this.cmp(other) > 0;
  };
  Q.greaterThan = Q.gt = function (x, y) {
    return new Decimal(x).gt(y);
  };

  P.greaterThanOrEqualTo = P.gte = function (other) {
    return this.cmp(other) >= 0;
  };
  Q.greaterThanOrEqualTo = Q.gte = function (x, y) {
    return new Decimal(x).gte(y);
  };

  P.lessThan = P.lt = function (other) {
    return this.cmp(other) < 0;
  };
  Q.lessThan = Q.lt = function (x, y) {
    return new Decimal(x).lt(y);
  };

  P.lessThanOrEqualTo = P.lte = function (other) {
    return this.cmp(other) <= 0;
  };
  Q.lessThanOrEqualTo = Q.lte = function (x, y) {
    return new Decimal(x).lte(y);
  };

  P.equalsTo = P.equal = P.eq = function (other) {
    return this.cmp(other) === 0;
  };
  Q.equalsTo = Q.equal = Q.eq = function (x, y) {
    return new Decimal(x).eq(y);
  };

  P.notEqualsTo = P.notEqual = P.neq = function (other) {
    return this.cmp(other) !== 0;
  };
  Q.notEqualsTo = Q.notEqual = Q.neq = function (x, y) {
    return new Decimal(x).neq(y);
  };

  P.minimum = P.min = function (other) {
    return this.lt(other) ? this.clone() : new Decimal(other);
  };
  Q.minimum = Q.min = function (x, y) {
    return new Decimal(x).min(y);
  };

  P.maximum = P.max = function (other) {
    return this.gt(other) ? this.clone() : new Decimal(other);
  };
  Q.maximum = Q.max = function (x, y) {
    return new Decimal(x).max(y);
  };

  P.compareTo_tolerance = P.cmp_tolerance = function (other, tolerance) {
    if (!(other instanceof Decimal)) other = new Decimal(other);
    return this.eq_tolerance(other, tolerance) ? 0 : this.cmp(other);
  };
  Q.compare_tolerance = Q.cmp_tolerance = function (x, y, tolerance) {
    return new Decimal(x).cmp_tolerance(y, tolerance);
  };

  P.greaterThan_tolerance = P.gt_tolerance = function (other, tolerance) {
    if (!(other instanceof Decimal)) other = new Decimal(other);
    return !this.eq_tolerance(other, tolerance) && this.gt(other);
  };
  Q.greaterThan_tolerance = Q.gt_tolerance = function (x, y, tolerance) {
    return new Decimal(x).gt_tolerance(y, tolerance);
  };

  P.greaterThanOrEqualTo_tolerance = P.gte_tolerance = function (other, tolerance) {
    if (!(other instanceof Decimal)) other = new Decimal(other);
    return this.eq_tolerance(other, tolerance) || this.gt(other);
  };
  Q.greaterThanOrEqualTo_tolerance = Q.gte_tolerance = function (x, y, tolerance) {
    return new Decimal(x).gte_tolerance(y, tolerance);
  };

  P.lessThan_tolerance = P.lt_tolerance = function (other, tolerance) {
    if (!(other instanceof Decimal)) other = new Decimal(other);
    return !this.eq_tolerance(other, tolerance) && this.lt(other);
  };
  Q.lessThan_tolerance = Q.lt_tolerance = function (x, y, tolerance) {
    return new Decimal(x).lt_tolerance(y, tolerance);
  };

  P.lessThanOrEqualTo_tolerance = P.lte_tolerance = function (other, tolerance) {
    if (!(other instanceof Decimal)) other = new Decimal(other);
    return this.eq_tolerance(other, tolerance) || this.lt(other);
  };
  Q.lessThanOrEqualTo_tolerance = Q.lte_tolerance = function (x, y, tolerance) {
    return new Decimal(x).lte_tolerance(y, tolerance);
  };

  P.equalsTo_tolerance = P.equal_tolerance = P.eq_tolerance = function (other, tolerance) {
    if (!(other instanceof Decimal)) other = new Decimal(other);
    if (tolerance == null) tolerance = 1e-7;
    if (this.isNaN() || other.isNaN() || this.isFinite() != other.isFinite()) return false;
    if (this.sign != other.sign) return false;
    if (this.layer !== other.layer) return false;
    var a, b, tR = this.array.length, oR = other.array.length;
    if (tR <= 1 && oR <= 1) {
      a = this.array[0] ? this.array[0][0] || 0 : 0;
      b = other.array[0] ? other.array[0][0] || 0 : 0;
      return Math.abs(a - b) <= tolerance * Math.max(Math.abs(a), Math.abs(b));
    }
    if (Math.abs(tR - oR) > 1) return false;
    for (var i = Math.max(tR, oR) - 1; i >= 0; i--) {
      var tRow = this.array[i] || [0];
      var oRow = other.array[i] || [0];
      if (cmpArr(tRow, oRow) !== 0) return false;
    }
    return true;
  };
  Q.equalsTo_tolerance = Q.equal_tolerance = Q.eq_tolerance = function (x, y, tolerance) {
    return new Decimal(x).eq_tolerance(y, tolerance);
  };

  P.notEqualsTo_tolerance = P.notEqual_tolerance = P.neq_tolerance = function (other, tolerance) {
    return !this.eq_tolerance(other, tolerance);
  };
  Q.notEqualsTo_tolerance = Q.notEqual_tolerance = Q.neq_tolerance = function (x, y, tolerance) {
    return new Decimal(x).neq_tolerance(y, tolerance);
  };

  P.isPositive = P.ispos = function () {
    return this.gt(Decimal.ZERO);
  };
  Q.isPositive = Q.ispos = function (x) {
    return new Decimal(x).ispos();
  };

  P.isNegative = P.isneg = function () {
    return this.lt(Decimal.ZERO);
  };
  Q.isNegative = Q.isneg = function (x) {
    return new Decimal(x).isneg();
  };

  P.isNaN = function () {
    return this.array[0] && isNaN(this.array[0][0]);
  };
  Q.isNaN = function (x) {
    return new Decimal(x).isNaN();
  };

  P.isFinite = function () {
    if (!this.array[0]) return true;
    return isFinite(this.array[0][0]);
  };
  Q.isFinite = function (x) {
    return new Decimal(x).isFinite();
  };

  P.isInfinite = function () {
    return this.array[0] && this.array[0][0] === Infinity;
  };
  Q.isInfinite = function (x) {
    return new Decimal(x).isInfinite();
  };

  P.layerUp = function () {
    var x = this.clone();
    if (x.isNaN()) return x;

    var actualRows = x.array.length;
    while (actualRows > 1 && isZeroArr(x.array[actualRows - 1])) actualRows--;

    if (actualRows <= 1) return x;

    var maxRow = x.array[actualRows - 1];
    x.array[0] = maxRow.slice(0);
    x.array = [x.array[0]];
    x.layer++;
    return x.normalize();
  };
  Q.layerUp = function (x) {
    return new Decimal(x).layerUp();
  };

  P.layerDown = function () {
    var x = this.clone();
    if (x.isNaN() || x.layer <= 0) return x;

    var hasRowsAfter = false;
    for (var i = 1; i < x.array.length; i++) {
      if (!isZeroArr(x.array[i])) {
        hasRowsAfter = true;
        break;
      }
    }

    if (hasRowsAfter) return x;

    if (x.array.length < 2) x.array.push([0]);
    x.array[1] = x.array[0].slice(0);
    x.array[0] = [0];
    x.layer--;
    return x.normalize();
  };
  Q.layerDown = function (x) {
    return new Decimal(x).layerDown();
  };

  function isSimple(x) {
    return x.layer === 0 && x.array.length === 1 &&
           x.array[0].length === 1 && isFinite(x.array[0][0]) &&
           Math.abs(x.array[0][0]) <= MAX_SAFE_INTEGER;
  }

  function hyperLevel(n, val) {
    var arr = new Array(n + 1);
    for (var i = 0; i <= n; i++) arr[i] = 0;
    arr[0] = val;
    arr[n] = 1;
    return new Decimal([arr]);
  }

  function hyperLevelSafe(n, val) {
    var arr = new Array(n + 1);
    for (var i = 0; i <= n; i++) arr[i] = 0;
    arr[0] = val;
    arr[n] = 1;
    var oldMaxCols = Decimal.maxCols;
    Decimal.maxCols = Math.max(oldMaxCols, n + 1);
    var r = new Decimal([arr]);
    Decimal.maxCols = oldMaxCols;
    return r;
  }

  function addOrdinalRow(Decimal, count, rawLevel) {
    // Add an ordinal row [count, raw_level] to the Decimal
    // If there's already an ordinal row with the same level, merge counts
    var x = Decimal.clone();
    if (typeof rawLevel !== 'number' || !isFinite(rawLevel) || rawLevel < 0) {
      return x;
    }
    if (count <= 0) return x;
    x.layer = Math.max(x.layer, 1);
    // Try to merge with existing row at the same level
    for (var i = 1; i < x.array.length; i++) {
      var row = x.array[i];
      if (row.length === 2 && row[1] === rawLevel) {
        row[0] += count;
        return x;
      }
    }
    if (x.array.length < Decimal.maxRows) {
      x.array.push([count, rawLevel]);
    }
    return x;
  }

  P.plus = P.add = function (other) {
    var x = this.clone();
    other = new Decimal(other);

    if (x.sign === -1) return x.neg().add(other.neg()).neg();
    if (other.sign === -1) return x.sub(other.neg());
    if (x.eq(Decimal.ZERO)) return other;
    if (other.eq(Decimal.ZERO)) return x;
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.isInfinite() && other.isInfinite() && x.eq(other.neg())) return Decimal.NaN.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return other;

    var p = x.min(other);
    var q = x.max(other);
    var t;

    if (q.gt(Decimal.E_MAX_SAFE_INTEGER) || q.div(p).gt(Decimal.MAX_SAFE_INTEGER)) {
      t = q;
    } else if (!q.array[0][1]) {
      t = new Decimal(x.toNumber() + other.toNumber());
    } else if (q.array[0][1] === 1) {
      var a = p.array[0][1] ? p.array[0][0] : Math.log10(p.array[0][0]);
      t = new Decimal([a + Math.log10(Math.pow(10, q.array[0][0] - a) + 1), 1]);
    }

    return t;
  };
  Q.plus = Q.add = function (x, y) {
    return new Decimal(x).add(y);
  };

  P.minus = P.sub = function (other) {
    var x = this.clone();
    other = new Decimal(other);

    if (x.sign === -1) return x.neg().sub(other.neg()).neg();
    if (other.sign === -1) return x.add(other.neg());
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.isInfinite() && other.isInfinite()) return Decimal.NaN.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return other.neg();
    if (x.eq(other)) return Decimal.ZERO.clone();
    if (other.eq(Decimal.ZERO)) return x;

    var p = x.min(other);
    var q = x.max(other);
    var n = other.gt(x);
    var t;

    if (q.gt(Decimal.E_MAX_SAFE_INTEGER) || q.div(p).gt(Decimal.MAX_SAFE_INTEGER)) {
      t = q;
      t = n ? t.neg() : t;
    } else if (!q.array[0][1]) {
      t = new Decimal(x.toNumber() - other.toNumber());
    } else if (q.array[0][1] === 1) {
      var a = p.array[0][1] ? p.array[0][0] : Math.log10(p.array[0][0]);
      t = new Decimal([a + Math.log10(Math.pow(10, q.array[0][0] - a) - 1), 1]);
      t = n ? t.neg() : t;
    }

    return t;
  };
  Q.minus = Q.sub = function (x, y) {
    return new Decimal(x).sub(y);
  };

  P.times = P.mul = function (other) {
    var x = this.clone();
    other = new Decimal(other);

    if (x.sign * other.sign === -1) return x.abs().mul(other.abs()).neg();
    if (x.sign === -1) return x.abs().mul(other.abs());
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.eq(Decimal.ZERO) && other.isInfinite()) return Decimal.NaN.clone();
    if (x.isInfinite() && other.eq(Decimal.ZERO)) return Decimal.NaN.clone();
    if (other.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (other.eq(Decimal.ONE)) return x.clone();
    if (x.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (x.eq(Decimal.ONE)) return other.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return other;

    if (x.max(other).gt(Decimal.EE_MAX_SAFE_INTEGER)) return x.max(other);

    var n = x.toNumber() * other.toNumber();
    if (n <= MAX_SAFE_INTEGER) return new Decimal(n);
    return Decimal.pow(10, x.log10().add(other.log10()));
  };
  Q.times = Q.mul = function (x, y) {
    return new Decimal(x).mul(y);
  };

  P.divide = P.div = function (other) {
    var x = this.clone();
    other = new Decimal(other);

    if (x.sign * other.sign === -1) return x.abs().div(other.abs()).neg();
    if (x.sign === -1) return x.abs().div(other.abs());
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.isInfinite() && other.isInfinite()) return Decimal.NaN.clone();
    if (x.eq(Decimal.ZERO) && other.eq(Decimal.ZERO)) return Decimal.NaN.clone();
    if (other.eq(Decimal.ZERO)) return Decimal.POSITIVE_INFINITY.clone();
    if (other.eq(Decimal.ONE)) return x.clone();
    if (x.eq(other)) return Decimal.ONE.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return Decimal.ZERO.clone();

    if (x.max(other).gt(Decimal.EE_MAX_SAFE_INTEGER)) return x.gt(other) ? x.clone() : Decimal.ZERO.clone();

    var n = x.toNumber() / other.toNumber();
    if (n <= MAX_SAFE_INTEGER) return new Decimal(n);
    var pw = Decimal.pow(10, x.log10().sub(other.log10()));
    var fp = pw.floor();
    if (pw.sub(fp).lt(new Decimal(1e-9))) return fp;
    return pw;
  };
  Q.divide = Q.div = function (x, y) {
    return new Decimal(x).div(y);
  };

  P.reciprocate = P.rec = function () {
    if (this.isNaN()) return Decimal.NaN.clone();
    if (this.eq(Decimal.ZERO)) return Decimal.NaN.clone();
    if (this.isInfinite()) return Decimal.ZERO.clone();
    if (this.layer > 0 || this.array.length > 1 || this.array[0].length > 1) return Decimal.ZERO.clone();
    return new Decimal(1 / this.array[0][0]);
  };
  Q.reciprocate = Q.rec = function (x) {
    return new Decimal(x).rec();
  };

  P.toPower = P.pow = function (other) {
    var x = this.clone();
    other = new Decimal(other);
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.sign === -1) return this.abs().pow(other).mul(Decimal.fromNumber(-1).pow(other));
    if (other.eq(Decimal.ZERO)) return Decimal.ONE.clone();
    if (x.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (x.eq(Decimal.ONE)) return Decimal.ONE.clone();
    if (other.eq(Decimal.ONE)) return x.clone();
    if (x.isInfinite() || other.isInfinite()) return x;
    if (isSimple(x) && isSimple(other)) {
      var powVal = Math.pow(x.array[0][0], other.array[0][0]);
      if (Number.isFinite(powVal) && Math.abs(powVal) <= MAX_SAFE_INTEGER) return new Decimal(powVal);
    }
    if (x.eq(Decimal.TEN)) {
      if (other.layer > 0 || other.array.length > 1) return other;
      var newRow0 = other.array[0].slice(0);
      newRow0[1] = (newRow0[1] || 0) + 1;
      return new Decimal(newRow0);
    }
    return Decimal.pow(10, x.log10().mul(other));
  };
  Q.toPower = Q.pow = function (x, y) {
    return new Decimal(x).pow(y);
  };

  P.exponential = P.exp = function () {
    if (this.isNaN()) return Decimal.NaN.clone();
    if (this.sign === -1) return this.abs().exp().rec();
    if (isSimple(this)) {
      var ev = Math.exp(this.array[0][0]);
      if (Number.isFinite(ev) && Math.abs(ev) <= MAX_SAFE_INTEGER) return new Decimal(ev);
    }
    return this;
  };
  Q.exponential = Q.exp = function (x) {
    return new Decimal(x).exp();
  };

  P.squareRoot = P.sqrt = function () {
    if (this.isNaN() || this.sign === -1) return Decimal.NaN.clone();
    if (this.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (isSimple(this)) return new Decimal(Math.sqrt(this.array[0][0]));
    return this;
  };
  Q.squareRoot = Q.sqrt = function (x) {
    return new Decimal(x).sqrt();
  };

  P.cubeRoot = P.cbrt = function () {
    if (this.isNaN()) return Decimal.NaN.clone();
    if (this.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (this.sign === -1) return this.abs().cbrt().neg();
    if (isSimple(this)) return new Decimal(Math.cbrt(this.array[0][0]));
    return this;
  };
  Q.cubeRoot = Q.cbrt = function (x) {
    return new Decimal(x).cbrt();
  };

  P.root = function (other) {
    var x = this.clone();
    other = new Decimal(other);
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.isInfinite()) return x;
    if (other.eq(Decimal.ZERO)) return Decimal.POSITIVE_INFINITY.clone();
    if (x.sign === -1 && other.mod(2).eq(Decimal.ONE)) return x.abs().root(other).neg();
    if (isSimple(x) && isSimple(other)) return new Decimal(Math.pow(x.array[0][0], 1 / other.array[0][0]));
    return x;
  };
  Q.root = function (x, y) {
    return new Decimal(x).root(y);
  };

  P.generalLogarithm = P.log10 = function () {
    if (this.isNaN() || this.sign === -1) return Decimal.NaN.clone();
    if (this.eq(Decimal.ZERO)) return Decimal.NEGATIVE_INFINITY.clone();
    if (this.isInfinite()) return this;
    if (isSimple(this)) {
      var lv = Math.log10(this.array[0][0]);
      if (Number.isFinite(lv)) return new Decimal(lv);
    }
    if (this.layer === 0 && this.array.length === 1 && this.array[0].length > 1) {
      var r0 = this.array[0];
      if (r0[1] > 0) {
        var newR0 = r0.slice(0);
        newR0[1]--;
        return new Decimal(newR0);
      }
      return this;
    }
    return this;
  };
  Q.generalLogarithm = Q.log10 = function (x) {
    return new Decimal(x).log10();
  };

  P.logarithm = P.logBase = P.log = function (base) {
    var x = this.clone();
    if (x.isNaN() || x.sign === -1) return Decimal.NaN.clone();
    base = new Decimal(base);
    if (base.isNaN() || base.eq(Decimal.ZERO) || base.eq(Decimal.ONE)) return Decimal.NaN.clone();
    if (x.eq(Decimal.ZERO)) return Decimal.NEGATIVE_INFINITY.clone();
    if (x.eq(Decimal.ONE)) return Decimal.ZERO.clone();
    if (isSimple(x) && isSimple(base)) {
      var lv = Math.log(x.array[0][0]) / Math.log(base.array[0][0]);
      if (Number.isFinite(lv)) return new Decimal(lv);
    }
    return x.log10().div(base.log10());
  };
  Q.logarithm = Q.logBase = Q.log = function (x, base) {
    return new Decimal(x).logBase(base);
  };

  P.naturalLogarithm = P.ln = function () {
    if (this.isNaN() || this.sign === -1) return Decimal.NaN.clone();
    if (this.eq(Decimal.ZERO)) return Decimal.NEGATIVE_INFINITY.clone();
    if (this.isInfinite()) return this;
    if (isSimple(this)) {
      var lv = Math.log(this.array[0][0]);
      if (Number.isFinite(lv)) return new Decimal(lv);
    }
    return this.log10().div(new Decimal(Math.LOG10E));
  };
  Q.naturalLogarithm = Q.ln = function (x) {
    return new Decimal(x).ln();
  };

  P.modular = P.mod = function (other) {
    other = new Decimal(other);
    if (other.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (this.sign * other.sign === -1) return this.abs().mod(other.abs()).neg();
    if (this.sign === -1) return this.abs().mod(other.abs());
    return this.sub(this.div(other).floor().mul(other));
  };
  Q.modular = Q.mod = function (x, y) {
    return new Decimal(x).mod(y);
  };

  P.gamma = function () {
    if (this.sign === -1) return Decimal.NaN.clone();
    if (this.isNaN() || this.isInfinite()) return this.clone();
    if (isSimple(this)) {
      if (Number.isInteger(this.array[0][0]) && this.array[0][0] >= 0 && this.array[0][0] <= 100) {
        var f = 1;
        for (var i = 2; i < this.array[0][0]; i++) f *= i;
        return new Decimal(f);
      }
      var g = f_gamma(this.array[0][0]);
      if (Number.isFinite(g) && Math.abs(g) <= MAX_SAFE_INTEGER) return new Decimal(g);
    }
    return this;
  };
  Q.gamma = function (x) {
    return new Decimal(x).gamma();
  };

  P.factorial = P.fact = function () {
    if (this.isNaN() || this.isInfinite()) return this;
    if (this.sign === -1) return this.abs().fact().neg();
    if (isSimple(this)) {
      if (Number.isInteger(this.array[0][0]) && this.array[0][0] >= 0 && this.array[0][0] <= 20) {
        var f = 1;
        for (var i = 2; i <= this.array[0][0]; i++) f *= i;
        return new Decimal(f);
      }
      var fa = f_gamma(this.array[0][0] + 1);
      if (Number.isFinite(fa) && Math.abs(fa) <= MAX_SAFE_INTEGER) return new Decimal(fa);
    }
    return this;
  };
  Q.factorial = Q.fact = function (x) {
    return new Decimal(x).fact();
  };

  P.lambertw = function (tol, principal) {
    if (tol === undefined) tol = 1e-10;
    if (principal === undefined) principal = true;
    if (this.isNaN()) return Decimal.NaN.clone();
    if (this.isInfinite()) return this.clone();
    if (isSimple(this)) {
      try {
        return new Decimal(f_lambertw(this.array[0][0], tol, principal));
      } catch (e) {
        return Decimal.NaN.clone();
      }
    }
    return d_lambertw(this, tol, principal);
  };
  Q.lambertw = function (x, tol, principal) {
    return new Decimal(x).lambertw(tol, principal);
  };

  P.floor = function () {
    if (this.isNaN() || this.isInfinite()) return this.clone();
    if (this.layer > 0 || this.array.length > 1 || this.array[0].length > 1) return this.clone();
    return new Decimal(Math.floor(this.array[0][0]));
  };
  Q.floor = function (x) {
    return new Decimal(x).floor();
  };

  P.ceiling = P.ceil = function () {
    if (this.isNaN() || this.isInfinite()) return this.clone();
    if (this.layer > 0 || this.array.length > 1 || this.array[0].length > 1) return this.clone();
    return new Decimal(Math.ceil(this.array[0][0]));
  };
  Q.ceiling = Q.ceil = function (x) {
    return new Decimal(x).ceil();
  };

  P.round = function () {
    if (this.isNaN() || this.isInfinite()) return this.clone();
    if (this.layer > 0 || this.array.length > 1 || this.array[0].length > 1) return this.clone();
    return new Decimal(Math.round(this.array[0][0]));
  };
  Q.round = function (x) {
    return new Decimal(x).round();
  };

  P.isInteger = P.isint = function () {
    if (this.isNaN() || this.isInfinite()) return false;
    if (this.sign === -1) return this.abs().isint();
    if (this.layer > 0 || this.array.length > 1 || this.array[0].length > 1) return true;
    return Number.isInteger(this.array[0][0]);
  };
  Q.isInteger = Q.isint = function (x) {
    return new Decimal(x).isint();
  };

  P.tetrate = P.tetr = function (other, payload) {
    if (payload === undefined) payload = Decimal.ONE;
    var x = this.clone();
    other = new Decimal(other);
    payload = new Decimal(payload);
    if (payload.neq(Decimal.ONE)) other = other.add(payload.slog(x));
    if (x.isNaN() || other.isNaN() || payload.isNaN()) return Decimal.NaN.clone();
    if (other.sign === -1) return Decimal.NaN.clone();
    if (other.eq(Decimal.NEGATIVE_INFINITY)) return Decimal.ZERO.clone();
    if (other.eq(Decimal.ZERO)) return Decimal.ONE.clone();
    if (other.eq(Decimal.ONE)) return x.clone();
    if (other.eq(2)) return x.pow(x);
    if (x.eq(Decimal.ZERO)) {
      if (other.eq(Decimal.ZERO)) return Decimal.NaN.clone();
      if (other.mod(2).eq(Decimal.ZERO)) return Decimal.ONE.clone();
      return Decimal.ZERO.clone();
    }
    if (x.eq(Decimal.ONE)) return Decimal.ONE.clone();
    if (x.eq(2)) {
      if (other.eq(3)) return new Decimal(16);
      if (other.eq(4)) return new Decimal(65536);
    }
    if (x.isInfinite() || other.isInfinite()) return x.max(other);
    var m = x.max(other);
    if (m.gt(hyperLevel(3, MAX_SAFE_INTEGER))) return m;
    if (m.gt(Decimal.TETRATED_MAX_SAFE_INTEGER) || other.gt(Decimal.MAX_SAFE_INTEGER)) {
      var j = x.slog(10).add(other);
      j.array[0][2] = (j.array[0][2] || 0) + 1;
      j.normalize();
      return j;
    }
    var y = other.toNumber();
    var f = Math.floor(y);
    var r = x.pow(y - f);
    for (var i = 0; f !== 0 && r.lt(Decimal.E_MAX_SAFE_INTEGER) && i < 100; i++) {
      if (f > 0) {
        r = x.pow(r);
        f--;
      }
    }
    if (i === 100) f = 0;
    r.array[0][1] = (r.array[0][1] + f) || f;
    r.normalize();
    return r;
  };
  Q.tetrate = Q.tetr = function (x, y, payload) {
    return new Decimal(x).tetr(y, payload);
  };

  P.iteratedexp = function (other) {
    var x = this.clone();
    other = new Decimal(other);
    if (other.sign === -1) return Decimal.ZERO.clone();
    if (isSimple(x) && isSimple(other) && Number.isInteger(other.array[0][0]) && other.array[0][0] <= 4) {
      var iv = x.array[0][0];
      var ic = other.array[0][0];
      var r = iv;
      for (var i = 0; i < ic; i++) r = Math.pow(10, r);
      if (Number.isFinite(r) && Math.abs(r) <= MAX_SAFE_INTEGER) return new Decimal(r);
    }
    return x;
  };
  Q.iteratedexp = function (x, y) {
    return new Decimal(x).iteratedexp(y);
  };

  P.iteratedlog = function (other) {
    var x = this.clone();
    other = new Decimal(other);
    if (other.sign === -1) return Decimal.POSITIVE_INFINITY.clone();
    if (other.eq(Decimal.ZERO)) return x.clone();
    if (isSimple(x) && isSimple(other) && Number.isInteger(other.array[0][0]) && other.array[0][0] <= 4) {
      var iv = x.array[0][0];
      var ic = other.array[0][0];
      if (ic <= 0) return x.clone();
      var r = iv;
      for (var i = 0; i < ic; i++) r = Math.log10(r);
      return new Decimal(r);
    }
    return x;
  };
  Q.iteratedlog = function (x, y) {
    return new Decimal(x).iteratedlog(y);
  };

  P.layeradd = function (other, base) {
    if (base == null) base = 10;
    var x = this.clone();
    other = new Decimal(other);
    base = new Decimal(base);
    if (x.isNaN() || other.isNaN() || base.isNaN()) return Decimal.NaN.clone();
    if (other.eq(Decimal.ZERO)) return x.clone();
    if (other.sign === -1) return Decimal.ZERO.clone();
    return x.tetr(other).tetr(base).logBase(base);
  };
  Q.layeradd = function (x, y, base) {
    return new Decimal(x).layeradd(y, base);
  };

  P.layeradd10 = function (other) {
    return this.layeradd(other, 10);
  };
  Q.layeradd10 = function (x, y) {
    return new Decimal(x).layeradd10(y);
  };

  P.ssqrt = P.ssrt = function () {
    if (this.sign === -1) return Decimal.NaN.clone();
    if (this.isNaN()) return Decimal.NaN.clone();
    if (this.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (this.eq(Decimal.ONE)) return Decimal.ONE.clone();
    if (isSimple(this)) {
      var v = this.array[0][0];
      if (v > 0 && v < 1) return new Decimal(v);
      try {
        var w = f_lambertw(Math.log(v));
        if (Number.isFinite(w)) return new Decimal(Math.exp(w));
      } catch (e) {}
    }
    return this.log10();
  };
  Q.ssqrt = Q.ssrt = function (x) {
    return new Decimal(x).ssqrt();
  };

  P.linear_sroot = function (other) {
    var x = this.clone();
    other = new Decimal(other);
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.sign === -1 || other.sign === -1) return Decimal.NaN.clone();
    if (other.eq(Decimal.ZERO)) return Decimal.ZERO.clone();
    if (other.eq(Decimal.ONE)) return x.clone();
    if (isSimple(x) && isSimple(other) && other.array[0][0] > 1) {
      var v = x.array[0][0];
      var n = other.array[0][0];
      try {
        var w = f_lambertw((n - 1) * Math.log(v / (n - 1)));
        if (Number.isFinite(w)) return new Decimal(Math.exp(w));
      } catch (e) {}
    }
    return x;
  };
  Q.linear_sroot = function (x, y) {
    return new Decimal(x).linear_sroot(y);
  };

  P.slog = function (base) {
    if (base === undefined) base = 10;
    var x = this.clone();
    base = new Decimal(base);
    if (x.isNaN() || base.isNaN()) return Decimal.NaN.clone();
    if (x.sign === -1 || base.sign === -1) return Decimal.NaN.clone();
    if (x.eq(Decimal.ONE)) return Decimal.ZERO.clone();
    if (x.lt(Decimal.ONE)) return Decimal.fromNumber(-1).add(x.slog(base));
    var m = x.max(base);
    if (m.gt(hyperLevel(3, MAX_SAFE_INTEGER))) {
      if (x.gt(base)) return x.clone();
      return Decimal.ZERO.clone();
    }
    if (m.gt(Decimal.TETRATED_MAX_SAFE_INTEGER)) {
      if (x.gt(base)) {
        x.array[0][2]--;
        x.normalize();
        return x.sub(x.array[0][1] || 0);
      }
      return Decimal.ZERO.clone();
    }
    if (isSimple(x) && isSimple(base) && base.array[0][0] > 1) {
      var v = x.array[0][0];
      var b = base.array[0][0];
      if (v <= Math.pow(b, b)) {
        if (v <= 1) return Decimal.ZERO.clone();
        var sl = 0;
        while (Math.pow(b, b) >= v && sl < 10) {
          v = Math.log(v) / Math.log(b);
          sl++;
          if (v <= 0) break;
        }
        if (sl > 0) return new Decimal(sl + v - 1);
      }
    }
    var r = 0;
    var t = (x.array[0][1] || 0) - (base.array[0][1] || 0);
    if (t > 3) {
      var l = t - 3;
      r += l;
      x.array[0][1] = x.array[0][1] - l;
    }
    for (var i = 0; i < 100; i++) {
      if (x.lt(0)) {
        x = Decimal.pow(base, x);
        r--;
      } else if (x.lte(1)) {
        return new Decimal(r + x.array[0][0] - 1);
      } else {
        r++;
        x = x.logBase(base);
      }
    }
    if (x.gt(10)) return new Decimal(r);
    return new Decimal(r + x.array[0][0] - 1);
  };
  Q.slog = function (x, base) {
    return new Decimal(x).slog(base);
  };

  P.pentate = P.pent = function (other) {
    return this.arrow(3)(other);
  };
  Q.pentate = Q.pent = function (x, y) {
    return Decimal.arrow(x, 3, y);
  };

  P.arrow = function (arrows) {
    var t = this.clone();
    arrows = new Decimal(arrows);
    if (!arrows.isint() || arrows.sign === -1) return function () { return Decimal.NaN.clone(); };
    if (arrows.eq(Decimal.ZERO)) return function (other) { return t.mul(other); };
    if (arrows.eq(Decimal.ONE)) return function (other) { return t.pow(other); };
    if (arrows.eq(2)) return function (other) { return t.tetr(other); };
    return function (other) {
      other = new Decimal(other);
      if (other.sign === -1) return Decimal.NaN.clone();
      if (other.eq(Decimal.ZERO)) return Decimal.ONE.clone();
      if (other.eq(Decimal.ONE)) return t.clone();
      if (other.eq(2)) return t.arrow(arrows.sub(Decimal.ONE))(t);
      var arrowsNum = arrows.toNumber();
      if (!isFinite(arrowsNum)) {
        // arrows is a huge Decimal (ω-level): result inherits the largest structure
        var j = t.max(other).max(arrows).clone();
        j.layer = 1;
        j.array.push([1, 0, 1]);
        j.normalize();
        return j;
      }
      if (arrows.gte(Decimal.maxArrow)) {
        // arrows is very large but still a JS number; use approximate overflow
        var j = t.max(other).clone();
        j.layer = 1;
        j.array.push([1, 0, 1]);
        j.normalize();
        return j;
      }
      if (t.max(other).gt(hyperLevelSafe(arrowsNum + 1, MAX_SAFE_INTEGER))) return t.max(other);
      if (arrowsNum >= Decimal.maxCols && t.array.length === 1 && other.array.length === 1) {
        var a = t.array[0][0];
        var b = other.array[0][0];
        if (b >= 2) {
          var count = b - 2;
          var baseResult = t.arrow(Decimal.maxCols - 1)(other);
          if (arrowsNum === Decimal.maxCols) {
            baseResult.array[0][Decimal.maxCols - 1] = (baseResult.array[0][Decimal.maxCols - 1] || 0) + count;
            baseResult.normalize();
            return baseResult;
          }
          if (arrowsNum === Decimal.maxCols + 1) {
            baseResult.array[0][Decimal.maxCols - 1] = (baseResult.array[0][Decimal.maxCols - 1] || 0) + count;
            baseResult.normalize();
            baseResult = addOrdinalRow(baseResult, count, Decimal.maxCols);
            baseResult.normalize();
            return baseResult;
          }
          var endLevel = arrowsNum - 1;
          var startLevel = Decimal.maxCols;
          var totalOrdinal = endLevel - startLevel + 1;
          if (totalOrdinal + 1 <= Decimal.maxRows) {
            r = t.arrow(Decimal.maxCols - 1)(other);
            for (var lev = startLevel; lev <= endLevel; lev++) {
              r = addOrdinalRow(r, count, lev);
            }
          } else {
            r = new Decimal(a);
            var keepStart = endLevel - Decimal.maxRows + 2;
            for (var lev = keepStart; lev <= endLevel; lev++) {
              r = addOrdinalRow(r, count, lev);
            }
          }
          r.normalize();
          return r;
        }
      }
      if (t.gt(hyperLevelSafe(arrowsNum, MAX_SAFE_INTEGER)) || other.gt(Decimal.MAX_SAFE_INTEGER)) {
        var r;
        if (t.gt(hyperLevelSafe(arrowsNum, MAX_SAFE_INTEGER))) {
          r = t.clone();
          if (arrowsNum < Decimal.maxCols) {
            r.array[0][arrowsNum]--;
          } else {
            var lastRow = r.array[r.array.length - 1];
            if (lastRow && lastRow.length >= 2 && typeof lastRow[lastRow.length - 1] === 'number') {
              lastRow[0] = (lastRow[0] || 0) - 1;
              if (lastRow[0] <= 0) r.array.pop();
            }
          }
          r.normalize();
        } else if (t.gt(hyperLevelSafe(arrowsNum - 1, MAX_SAFE_INTEGER))) {
          if (arrowsNum - 1 < Decimal.maxCols) {
            r = new Decimal(t.array[0][arrowsNum - 1]);
          } else {
            r = Decimal.ZERO.clone();
          }
        } else {
          r = Decimal.ZERO.clone();
        }
        var j = r.add(other);
        if (arrowsNum < Decimal.maxCols) {
          j.array[0][arrowsNum] = (j.array[0][arrowsNum] || 0) + 1;
        } else {
          j = addOrdinalRow(j, 1, arrowsNum);
        }
        j.normalize();
        return j;
      }
      var y = other.toNumber();
      var f = Math.floor(y);
      var arrows_m1 = arrows.sub(Decimal.ONE);
      var r = t.arrow(arrows_m1)(y - f);
      var initFloor = Math.floor(other.toNumber());
      for (var i = 0; f !== 0 && r.lt(hyperLevelSafe(arrowsNum - 1, MAX_SAFE_INTEGER)) && i < 100; i++) {
        if (f > 0) {
          r = t.arrow(arrows_m1)(r);
          f--;
        }
      }
      if (i === 100) f = 0;
      if (arrowsNum - 1 < Decimal.maxCols) {
        if (f > 0) {
          r.array[0][arrowsNum - 1] = (r.array[0][arrowsNum - 1] || 0) + f;
        }
      } else {
        var count = f > 0 ? f : (i > 0 && initFloor > 0 ? initFloor - 1 : 0);
        if (count > 0) {
          r = addOrdinalRow(r, count, arrowsNum - 1);
        }
      }
      r.normalize();
      return r;
    };
  };
  P.chain = function (other, arrows) {
    return this.arrow(arrows)(other);
  };
  Q.arrow = function (x, arrows, y) {
    return new Decimal(x).arrow(arrows)(y);
  };
  Q.chain = function (x, y, arrows) {
    return new Decimal(x).arrow(arrows)(y);
  };
  P.aperiote = P.aper = function (y) {
    return this.arrow(y)(this);
  };
  Q.aperiote = Q.aper = function (x, y) {
    return new Decimal(x).arrow(y)(x);
  };

  P.inv_aperiote = P.i_aper = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 0 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length === 2 && row[1] > 0) {
          return new Decimal(row[1] + 1);
        }
      }
      return result;
    }
    if (z.layer === 0 && z.array.length === 1) {
      var r0 = z.array[0];
      if (r0.length > 1 && r0[1] > 0) {
        return new Decimal(r0[1] + 1);
      }
      return new Decimal(1);
    }
    return z;
  };
  Q.inv_aperiote = Q.i_aper = function (x, z) {
    return new Decimal(x).inv_aperiote(z);
  };

  P.expande = P.expa = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.aperiote(x);  // expande(x, 2)
    if (y.layer === 0) {
      // finite y: r0 from base, Cantor expansion
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(0);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    // ordinal y: clone y, set r0, add [1, 1, 1]
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 1, 1]);
    result.normalize();
    return result;
  };
  Q.expande = Q.expa = function (x, y) {
    return new Decimal(x).expande(y);
  };

  P.inv_expande = P.i_expa = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      // First: find ordinal marker [1, 1, 1]
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 1 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      // Second: find iteration count [count, 0, 1]
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 0 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      // Fallback: finite-level result
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row2 = result.array[i];
        if (row2.length === 2 && row2[1] > 0) {
          return new Decimal(row2[1] + 1);
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_expande = Q.i_expa = function (x, z) {
    return new Decimal(x).inv_expande(z);
  };

  P.multiexpande = P.muea = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.expande(x);  // multiexpande(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(1);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 2, 1]);
    result.normalize();
    return result;
  };
  Q.multiexpande = Q.muea = function (x, y) {
    return new Decimal(x).multiexpande(y);
  };

  P.inv_multiexpande = P.i_muea = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 2 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 1 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_multiexpande = Q.i_muea = function (x, z) {
    return new Decimal(x).inv_multiexpande(z);
  };

  P.powerexpande = P.poea = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.multiexpande(x);  // powerexpande(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(2);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 3, 1]);
    result.normalize();
    return result;
  };
  Q.powerexpande = Q.poea = function (x, y) {
    return new Decimal(x).powerexpande(y);
  };

  P.inv_powerexpande = P.i_poea = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 3 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 2 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_powerexpande = Q.i_poea = function (x, z) {
    return new Decimal(x).inv_powerexpande(z);
  };

  P.aperioexpansion = P.apea = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.expande(x);
    if (y.eq(2)) return x.multiexpande(x);
    if (y.eq(3)) return x.powerexpande(x);
    var base = x.powerexpande(x);  // aperioexpansion(x, 3)
    if (y.layer === 0) {
      var result = base.clone();
      var count = y.toNumber() - 3;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(3);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 4, 1]);
    result.normalize();
    return result;
  };
  Q.aperioexpansion = Q.apea = function (x, y) {
    return new Decimal(x).aperioexpansion(y);
  };

  P.inv_aperioexpansion = P.i_apea = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 4 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 3 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_aperioexpande = Q.i_apea = function (x, z) {
    return new Decimal(x).inv_aperioexpansion(z);
  };

  P.explode = P.expl = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.aperioexpansion(x);  // explode(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(3);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 4, 1]);
    result.normalize();
    return result;
  };
  Q.explode = Q.expl = function (x, y) {
    return new Decimal(x).explode(y);
  };

  P.inv_explode = P.i_expl = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 4 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 3 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_explode = Q.i_expl = function (x, z) {
    return new Decimal(x).inv_explode(z);
  };

  P.multiexplode = P.muel = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.explode(x);  // multiexplode(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(4);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 5, 1]);
    result.normalize();
    return result;
  };
  Q.multiexplode = Q.muel = function (x, y) {
    return new Decimal(x).multiexplode(y);
  };

  P.inv_multiexplode = P.i_muel = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 5 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 4 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_multiexplode = Q.i_muel = function (x, z) {
    return new Decimal(x).inv_multiexplode(z);
  };

  P.aperioexplode = P.apel = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.explode(x);
    if (y.eq(2)) return x.multiexplode(x);
    var base = x.multiexplode(x);  // aperioexplode(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(5);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 6, 1]);
    result.normalize();
    return result;
  };
  Q.aperioexplode = Q.apel = function (x, y) {
    return new Decimal(x).aperioexplode(y);
  };

  P.inv_aperioexplode = P.i_apel = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 6 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 5 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_aperioexplode = Q.i_apel = function (x, z) {
    return new Decimal(x).inv_aperioexplode(z);
  };

  P.detonate = P.deto = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.aperioexplode(x);  // detonate(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(5);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 6, 1]);
    result.normalize();
    return result;
  };
  Q.detonate = Q.deto = function (x, y) {
    return new Decimal(x).detonate(y);
  };

  P.inv_detonate = P.i_deto = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 6 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 5 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_detonate = Q.i_deto = function (x, z) {
    return new Decimal(x).inv_detonate(z);
  };

  P.aperionate = P.apeo = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.aperiote(x);
    if (y.eq(2)) return x.aperioexpansion(x);
    if (y.eq(3)) return x.aperioexplode(x);
    var base = x.aperioexplode(x);  // aperionate(x, 3)
    if (y.layer === 0) {
      var result = base.clone();
      var count = y.toNumber() - 3;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(6);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 7, 1]);
    result.normalize();
    return result;
  };
  Q.aperionate = Q.apeo = function (x, y) {
    return new Decimal(x).aperionate(y);
  };

  P.inv_aperionate = P.i_apeo = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 7 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 6 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_aperionate = Q.i_apeo = function (x, z) {
    return new Decimal(x).inv_aperionate(z);
  };

  // megote (ω^2+1): iterates aperionate
  P.megote = P.mego = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.aperionate(x);  // megote(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(7);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 8, 1]);
    result.normalize();
    return result;
  };
  Q.megote = Q.mego = function (x, y) {
    return new Decimal(x).megote(y);
  };

  P.inv_megote = P.i_mego = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 8 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 7 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_megote = Q.i_mego = function (x, z) {
    return new Decimal(x).inv_megote(z);
  };

  // aperimegote (ω^2+ω): diagonalization at ω^2 level
  P.aperimegote = P.apmg = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.megote(x);
    var base = x.megote(x);  // aperimegote(x, 1)
    if (y.layer === 0) {
      var result = base.clone();
      var count = y.toNumber() - 1;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(8);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 9, 1]);
    result.normalize();
    return result;
  };
  Q.aperimegote = Q.apmg = function (x, y) {
    return new Decimal(x).aperimegote(y);
  };

  P.inv_aperimegote = P.i_apmg = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 9 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 8 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_aperimegote = Q.i_apmg = function (x, z) {
    return new Decimal(x).inv_aperimegote(z);
  };

  // megoexpande (ω^2+ω+1): iterates aperimegote
  P.megoexpande = P.mgea = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.aperimegote(x);  // megoexpande(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(8);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 9, 1]);
    result.normalize();
    return result;
  };
  Q.megoexpande = Q.mgea = function (x, y) {
    return new Decimal(x).megoexpande(y);
  };

  P.inv_megoexpande = P.i_mgea = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 9 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 8 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_megoexpande = Q.i_mgea = function (x, z) {
    return new Decimal(x).inv_megoexpande(z);
  };

  // megoaperionation (ω^2*2): diagonalization at ω^2+ω level
  P.megoaperionation = P.mgao = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.megote(x);
    if (y.eq(2)) return x.aperimegote(x);
    if (y.eq(3)) return x.megoexpande(x);
    var base = x.megoexpande(x);  // megoaperionation(x, 3)
    if (y.layer === 0) {
      var result = base.clone();
      var count = y.toNumber() - 3;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(9);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 10, 1]);
    result.normalize();
    return result;
  };
  Q.megoaperionation = Q.mgao = function (x, y) {
    return new Decimal(x).megoaperionation(y);
  };

  P.inv_megoaperionation = P.i_mgao = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 10 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 9 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_megoaperionation = Q.i_mgao = function (x, z) {
    return new Decimal(x).inv_megoaperionation(z);
  };

  // gigote (ω^2*2+1): iterates megoaperionation
  P.gigote = P.gigo = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.megoaperionation(x);  // gigote(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(9);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 10, 1]);
    result.normalize();
    return result;
  };
  Q.gigote = Q.gigo = function (x, y) {
    return new Decimal(x).gigote(y);
  };

  P.inv_gigote = P.i_gigo = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 10 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 9 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_gigote = Q.i_gigo = function (x, z) {
    return new Decimal(x).inv_gigote(z);
  };

  // aperiatotion (ω^3): diagonalization of ω^2*y
  P.aperiatotion = P.apat = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.aperionate(x);
    if (y.eq(2)) return x.megoaperionation(x);
    var base = x.megoaperionation(x);  // aperiatotion(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(10);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 11, 1]);
    result.normalize();
    return result;
  };
  Q.aperiatotion = Q.apat = function (x, y) {
    return new Decimal(x).aperiatotion(y);
  };

  P.inv_aperiatotion = P.i_apat = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 11 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 10 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_aperiatotion = Q.i_apat = function (x, z) {
    return new Decimal(x).inv_aperiatotion(z);
  };

  // powiainate (ω^3+1): iterates aperiatotion
  P.powiainate = P.pwan = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    var base = x.aperiatotion(x);  // powiainate(x, 2)
    if (y.layer === 0) {
      var result = base.clone();
      if (y.eq(2)) return result;
      var count = y.toNumber() - 2;
      if (count > 0) {
        result.layer = 0;
        result.array = [base.array[0].slice()];
        var cl = Decimal.getCantorLevel(10);
        var maxVal = (cl >= 2) ? (y.toNumber() - 1) : count;
        var ordRows = Decimal.expandOrdinals(cl, maxVal);
        for (var i = 0; i < ordRows.length; i++) {
          result.array.push(ordRows[i]);
        }
        result.normalize();
      }
      return result;
    }
    var result = y.clone();
    result.array[0] = base.array[0].slice();
    result.layer = 0;
    result.array.push([1, 11, 1]);
    result.normalize();
    return result;
  };
  Q.powiainate = Q.pwan = function (x, y) {
    return new Decimal(x).powiainate(y);
  };

  P.inv_powiainate = P.i_pwan = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 11 && row[2] === 1 && row[0] === 1) {
          result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[1] === 10 && row[2] === 1 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_powiainate = Q.i_pwan = function (x, z) {
    return new Decimal(x).inv_powiainate(z);
  };

  // iter (ω^ω): diagonalizes ω^x operations
  // k <= maxCols-2: layer 0, multi-index; k >= maxCols-1: layer 1
  P.iter = P.ite = function (y) {
    var x = this.clone();
    y = new Decimal(y);
    if (x.isNaN() || y.isNaN()) return Decimal.NaN.clone();
    if (y.eq(Decimal.ONE)) return x.clone();
    if (y.lte(Decimal.ZERO)) return Decimal.NaN.clone();
    
    if (y.layer === 0 && y.array.length <= 1) {
      var yn = y.toNumber();
      var maxLevel = Decimal.maxCols - 1;
      if (yn < maxLevel) {
        // y fits within ordinal levels: create ω^y at layer 0
        // Multi-index format: [1, 0, 0, ..., 0, 1] with yn zeros
        var result = x.clone();
        var row = [1];
        for (var i = 0; i < yn; i++) row.push(0);
        row.push(1);
        result.layer = 0;
        result.array.push(row);
        result.normalize();
        return result;
      } else {
        // y >= maxLevel: promote to layer 1, compact format
        var result = x.clone();
        result.layer = 1;
        result.array.push([1, yn, 1]);
        result.normalize();
        return result;
      }
    }
    
    // y is ordinal: iter on ordinal
    // Promote: absorb y's ordinal rows into r0, add iter marker
    // Layer promotion consumes one level: skip the first value
    var result = y.clone();
    var newR0 = x.array[0].slice();
    // Absorb y's ordinal rows into r0 (skip count and first value)
    for (var ir = 1; ir < y.array.length; ir++) {
      var yrow = y.array[ir];
      // Start from index 2 to skip count and first ordinal value
      for (var jc = 2; jc < yrow.length; jc++) {
        newR0.push(yrow[jc]);
      }
    }
    result.array[0] = newR0;
    result.array = [newR0];
    // Add iter's own ordinal marker
    result.array.push([1, 0, 1]);
    result.layer = y.layer + 1;
    result.normalize();
    return result;
  };
  Q.iter = Q.ite = function (x, y) {
    return new Decimal(x).iter(y);
  };

  P.inv_iter = P.i_ite = function (z) {
    var x = this.clone();
    z = new Decimal(z);
    if (x.isNaN() || z.isNaN()) return Decimal.NaN.clone();
    if (z.array.length >= 2) {
      var result = z.clone();
      // Find the highest ordinal row and decrement/remove it
      for (var i = result.array.length - 1; i >= 1; i--) {
        var row = result.array[i];
        if (row.length >= 3 && row[0] > 0) {
          row[0]--;
          if (row[0] <= 0) result.array.splice(i, 1);
          result.normalize();
          if (result.array.length <= 1) result.layer = 0;
          return result;
        }
      }
      return result;
    }
    return z;
  };
  Q.inv_iter = Q.i_ite = function (x, z) {
    return new Decimal(x).inv_iter(z);
  };
  


  P.choose = function (other) {
    var x = this.clone();
    other = new Decimal(other);
    if (x.isNaN() || other.isNaN()) return Decimal.NaN.clone();
    if (x.sign === -1 || other.sign === -1) return Decimal.ZERO.clone();
    if (other.eq(Decimal.ZERO) || x.eq(other)) return Decimal.ONE.clone();
    if (x.lt(other)) return Decimal.ZERO.clone();
    if (isSimple(x) && isSimple(other) && Number.isInteger(x.array[0][0]) && Number.isInteger(other.array[0][0]) &&
        x.array[0][0] >= 0 && other.array[0][0] >= 0 && x.array[0][0] <= 1000 && other.array[0][0] <= 1000) {
      var n = x.array[0][0];
      var k = other.array[0][0];
      if (k > n - k) k = n - k;
      var result = 1;
      for (var i = 0; i < k; i++) result = result * (n - i) / (i + 1);
      return new Decimal(result);
    }
    return x.fact().div(other.fact().mul(x.sub(other).fact()));
  };
  Q.choose = function (x, y) {
    return new Decimal(x).choose(y);
  };

  P.toNumber = function () {
    if (this.sign === -1) return -this.abs().toNumber();
    if (this.isNaN()) return NaN;
    if (this.isInfinite()) return Infinity;
    if (this.layer > 0) return Infinity;
    if (this.array.length > 1) return Infinity;
    var r0 = this.array[0];
    if (r0.length === 1) return r0[0];
    return Infinity;
  };
  Q.toNumber = function (x) {
    return new Decimal(x).toNumber();
  };

  P.valueOf = function () {
    return this.toString();
  };

  P.toString = function () {
    function formatCount(pattern, count) {
      return count >= 4 ? pattern + "^" + count : pattern.repeat(count);
    }
    function formatFiniteOps(r0) {
      var parts = [];
      for (var i = r0.length - 1; i >= 1; i--) {
        if (r0[i] > 0) {
          var letter = String.fromCharCode(68 + i);
          var token = formatCount(letter, r0[i]);
          parts.push(token);
        }
      }
      if (parts.length === 0) return "";
      var hasPower = false;
      for (var j = 0; j < parts.length; j++) {
        if (parts[j].indexOf("^") !== -1) { hasPower = true; break; }
      }
      var sep = hasPower ? " " : "";
      return parts.join(sep) + (hasPower ? " " : "");
    }
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return this.sign === -1 ? "-Infinity" : "Infinity";

    if (this.eq(Decimal.ZERO)) return "0";

    if (this.sign === -1) return "-" + this.abs().toString();

    if (this.layer > 0) {
      var LAYER_SYMBOLS = {1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 6: '&', 7: '~', 8: '<', 9: '>', 10: '?'};
      var sym = this.layer <= 10 ? LAYER_SYMBOLS[this.layer] : null;
      
      // Layer >= 11: use {m}ε{n} format
      if (this.layer >= 11) {
        var s2 = "";
        if (this.array.length >= 2) {
          var lastRow = this.array[this.array.length - 1];
          var lastCount = lastRow[0];
          s2 = "{" + lastCount + "}\u03B5{" + this.layer + "}";
        } else {
          s2 = "\u03B5{" + this.layer + "}";
        }
        s2 += " [" + this.array[0].join(",") + "]";
        for (var i = 1; i < this.array.length - 1; i++) {
          s2 += " [" + this.array[i].join(",") + "]";
        }
        return s2;
      }
      
      // Layers 1-10: try letter notation
      if (sym && this.array.length >= 2) {
        var ordTokens = [];
        var validLetter = true;
        
        for (var i = this.array.length - 1; i >= 1; i--) {
          var row = this.array[i];
          if (row.length < 3) { validLetter = false; break; }
          var diag = row[row.length - 1];
          var countVals = row[0];
          var vals = row.slice(1, row.length - 1);
          var n = vals.length;
          
          if (diag < 1 || diag > 26) { validLetter = false; break; }
          
          var U = String.fromCharCode(64 + diag);
          var allZero = true;
          var anyLarge = false;
          var largeVal = -1;
          for (var j = 0; j < n; j++) {
            if (vals[j] > 25) { anyLarge = true; largeVal = vals[j]; }
            if (vals[j] !== 0) allZero = false;
          }
          
          var token;
          if (allZero) {
            token = n > 26 ? U + "a" + n : U + "a".repeat(n);
          } else if (anyLarge && n === 1) {
            // Compact format: single large value
            token = U + "a" + largeVal;
          } else {
            var lower = "";
            var ok = true;
            for (var j = n - 1; j >= 0; j--) {
              if (vals[j] > 25) { ok = false; break; }
              lower += String.fromCharCode(97 + vals[j]);
            }
            if (!ok) { validLetter = false; break; }
            token = U + lower;
          }
          if (countVals > 1) {
            token = countVals >= 4 ? token + "^" + countVals : token.repeat(countVals);
          }
          ordTokens.push(token);
        }
        
        if (validLetter && ordTokens.length > 0) {
          var finOps = formatFiniteOps(this.array[0]);
          return sym + ordTokens.join("") + (finOps ? finOps : "");
        }
      }
      
      // Ultimate fallback: array notation with layer symbol
      var s = (this.layer <= 10 ? LAYER_SYMBOLS[this.layer] || ("!".repeat(this.layer)) : "e" + this.layer) + " ";
      for (var i = 0; i < this.array.length; i++) {
        if (i > 0) s += " ";
        s += "[" + this.array[i].join(",") + "]";
      }
      return s;
    }

    if (this.array.length <= 1) {
      var r0 = this.array[0];

      if (r0.length === 1) return String(r0[0]);

      if (r0.length >= 24) {
        var highestIdx = -1;
        for (var j = r0.length - 1; j >= 1; j--) {
          if (r0[j] && r0[j] !== 0) {
            highestIdx = j;
            break;
          }
        }
        if (highestIdx !== -1) {
          return r0[highestIdx] + "Aa" + highestIdx;
        }
      }

      var result = "";
      for (var j = r0.length - 1; j >= 1; j--) {
        if (!r0[j] || r0[j] === 0) continue;
        var letter = String.fromCharCode(68 + j);
        if (r0[j] > 3) {
          result += letter + "^" + r0[j] + " ";
        } else {
          result += letter.repeat(r0[j]);
        }
      }
      result += decimalPlaces(r0[0], 6);
      return result;
    }

    // Layer 0 with ordinal rows: try letter notation
    if (this.array.length > 1) {
      var ordTokens = [];
      var validLetter = true;
      var useExclaim = false;
      
      for (var i = this.array.length - 1; i >= 1; i--) {
        var row = this.array[i];
        if (row.length < 3) { validLetter = false; break; }
        var diag = row[row.length - 1];
        var countVals = row[0];
        var vals = row.slice(1, row.length - 1);
        var n = vals.length;
        
        if (diag < 1 || diag > 26) { validLetter = false; break; }
        
        var U = String.fromCharCode(64 + diag);
        var allZero = true;
        var anyLarge = false;
        for (var j = 0; j < n; j++) {
          if (vals[j] > 25) { anyLarge = true; }
          if (vals[j] !== 0) allZero = false;
        }
        if (anyLarge) { validLetter = false; break; }
        if (!validLetter) break;
        
        var token;
        if (allZero) {
          if (n > 26) {
            useExclaim = true;
            token = U + "a" + n;
          } else {
            token = U + "a".repeat(n);
          }
        } else {
          var lower = "";
          for (var j = n - 1; j >= 0; j--) {
            lower += String.fromCharCode(97 + vals[j]);
          }
          token = U + lower;
        }
        if (countVals > 1) {
          token = countVals >= 4 ? token + "^" + countVals : token.repeat(countVals);
        }
        ordTokens.push(token);
      }
      
      if (validLetter) {
        var finOps = formatFiniteOps(this.array[0]);
        var prefix = useExclaim ? "!" : "";
        var baseNum = useExclaim ? "" : decimalPlaces(this.array[0][0], 6);
        return prefix + ordTokens.join("") + (finOps ? finOps : "") + baseNum;
      }
    }

    if (this.array.length === 2 &&
        this.array[0].length === 1 && this.array[0][0] === 10 &&
        this.array[1].length === 2) {
      return this.array[1][0] + "Aa" + this.array[1][1];
    }

    var multiResult = "";
    for (var i = 0; i < this.array.length; i++) {
      if (i > 0) multiResult += " ";
      multiResult += "[" + this.array[i].join(",") + "]";
    }
    return multiResult;
  };

  P.toJSON = function () {
    if (Decimal.serializeMode === 0) {
      return {
        sign: this.sign,
        array: deepCloneArray(this.array),
        layer: this.layer
      };
    } else {
      return this.toString();
    }
  };

  P.toStringWithDecimalPlaces = function (places) {
    if (this.sign === -1) return "-" + this.abs().toStringWithDecimalPlaces(places);
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return "Infinity";
    if (isSimple(this)) {
      var v = decimalPlaces(this.array[0][0], places);
      if (Number.isFinite(v)) return v.toString();
    }
    return this.toString();
  };

  P.toExponential = function (places) {
    if (this.sign === -1) return "-" + this.abs().toExponential(places);
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return "Infinity";
    if (isSimple(this)) return this.toNumber().toExponential(places);
    return this.toString();
  };

  P.toFixed = function (places) {
    if (this.sign === -1) return "-" + this.abs().toFixed(places);
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return "Infinity";
    if (isSimple(this)) return this.toNumber().toFixed(places);
    return this.toString();
  };

  P.toPrecision = function (places) {
    if (this.sign === -1) return "-" + this.abs().toPrecision(places);
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return "Infinity";
    if (isSimple(this)) return this.toNumber().toPrecision(places);
    return this.toString();
  };

  P.toHyperE = function () {
    if (this.sign === -1) return "-" + this.abs().toHyperE();
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return "Infinity";
    if (isSimple(this)) {
      var v = this.array[0][0];
      if (v < 10) return String(v);
      return "E" + Math.log10(v).toFixed(6);
    }
    if (this.layer > 0) return "E" + this.layer + "#" + this.toString();
    if (this.array.length === 1 && this.array[0].length >= 2) {
      var s = "E";
      for (var i = 1; i < this.array[0].length; i++) s += "#";
      s += String(this.array[0][0]);
      return s;
    }
    return this.toString();
  };

  Q.fromNumber = function (input) {
    if (typeof input !== "number") throw Error(invalidArgument + "Expected Number");
    var x = new Decimal();
    x.array = [[Math.abs(input)]];
    x.sign = input < 0 ? -1 : 1;
    x.layer = 0;
    return x.normalize();
  };

  Q.fromArray = function (array, sign, layer) {
    if (!Array.isArray(array)) throw Error(invalidArgument + "Expected Array");
    var x = new Decimal();
    if (array.length > 0 && !Array.isArray(array[0])) {
      x.array = [array.slice(0)];
    } else {
      x.array = deepCloneArray(array);
    }
    if (typeof sign === "number") x.sign = sign < 0 ? -1 : 1;
    else x.sign = 1;
    if (typeof layer === "number" && isFinite(layer) && layer >= 0) x.layer = Math.floor(layer);
    else if (x.array.length > 1) x.layer = 1;
    else x.layer = 0;
    return x.normalize();
  };

  Q.fromObject = function (input) {
    if (typeof input !== "object") throw Error(invalidArgument + "Expected Object");
    if (input === null) return Decimal.ZERO.clone();
    if (Array.isArray(input)) return Decimal.fromArray(input);
    if (input instanceof Decimal) return new Decimal(input);
    if (!(input.array instanceof Array)) throw Error(invalidArgument + "Expected that property 'array' exists");
    var x = new Decimal();
    x.array = deepCloneArray(input.array);
    x.sign = typeof input.sign === "number" ? (input.sign < 0 ? -1 : 1) : 1;
    x.layer = typeof input.layer === "number" && isFinite(input.layer) && input.layer >= 0 ? Math.floor(input.layer) : 0;
    return x.normalize();
  };

  Q.fromJSON = function (input) {
    if (typeof input === "object") return Decimal.fromObject(input);
    if (typeof input !== "string") throw Error(invalidArgument + "Expected String");
    var parsedObject;
    try {
      parsedObject = JSON.parse(input);
    } catch (e) {
      throw Error(invalidArgument + "Invalid JSON string");
    }
    return Decimal.fromObject(parsedObject);
  };

  Q.hyper = function (n, a, b) {
    if (n === undefined) n = 2;
    n = new Decimal(n);
    a = new Decimal(a);
    b = new Decimal(b);
    if (n.isNaN() || a.isNaN() || b.isNaN()) return Decimal.NaN.clone();
    if (n.eq(Decimal.ZERO)) return b.add(Decimal.ONE);
    if (n.eq(Decimal.ONE)) return a.add(b);
    if (n.eq(2)) return a.mul(b);
    if (n.eq(3)) return a.pow(b);
    if (n.eq(4)) return a.tetr(b);
    if (n.eq(5)) return a.pent(b);
    return a.arrow(b, n.sub(1));
  };

  Q.affordGeometricSeries = function (resourcesAvailable, priceStart, priceRatio, currentOwned) {
    resourcesAvailable = new Decimal(resourcesAvailable);
    priceStart = new Decimal(priceStart);
    priceRatio = new Decimal(priceRatio);
    currentOwned = new Decimal(currentOwned);
    return priceStart.eq(new Decimal(1))
      ? resourcesAvailable.add(new Decimal(1)).floor()
      : Decimal.ONE;
  };

  Q.affordArithmeticSeries = function (resourcesAvailable, priceStart, priceAdd, currentOwned) {
    resourcesAvailable = new Decimal(resourcesAvailable);
    priceStart = new Decimal(priceStart);
    priceAdd = new Decimal(priceAdd);
    currentOwned = new Decimal(currentOwned);
    if (priceAdd.eq(Decimal.ZERO)) return resourcesAvailable.div(priceStart).floor();
    var a = priceAdd;
    var b = priceStart.mul(2).sub(priceAdd);
    var c = priceStart.sub(priceAdd).sub(resourcesAvailable.mul(2)).add(a);
    return b.neg().add(b.pow(2).sub(a.mul(c).mul(4)).sqrt()).div(a.mul(2)).floor();
  };

  Q.sumGeometricSeries = function (numItems, start, ratio, numItemsStart) {
    if (numItemsStart === undefined) numItemsStart = 0;
    numItems = new Decimal(numItems);
    start = new Decimal(start);
    ratio = new Decimal(ratio);
    numItemsStart = new Decimal(numItemsStart);
    if (numItems.lt(numItemsStart)) return Decimal.ZERO.clone();
    return start.mul(Decimal.ONE.sub(ratio.pow(numItems.sub(numItemsStart).add(Decimal.ONE))))
      .div(Decimal.ONE.sub(ratio));
  };

  Q.sumArithmeticSeries = function (numItems, start, add, numItemsStart) {
    if (numItemsStart === undefined) numItemsStart = 0;
    numItems = new Decimal(numItems);
    start = new Decimal(start);
    add = new Decimal(add);
    numItemsStart = new Decimal(numItemsStart);
    if (numItems.lt(numItemsStart)) return Decimal.ZERO.clone();
    var n = numItems.sub(numItemsStart).add(Decimal.ONE);
    var last = start.add(add.mul(n.sub(Decimal.ONE)));
    return n.mul(start.add(last)).div(new Decimal(2));
  };

  Q.choose = function (x, y) {
    return new Decimal(x).choose(y);
  };

  Q.fromBigInt = function (input) {
    if (typeof BigInt === "undefined") throw Error(DecimalError + "BigInt is not supported in current environment");
    if (typeof input === "bigint") {
      if (input >= BigInt(0) && input <= BigInt(MAX_SAFE_INTEGER)) {
        return new Decimal(Number(input));
      }
      var inputStr = input.toString();
      var inputLen = inputStr.length;
      if (inputLen <= LONG_STRING_MIN_LENGTH) {
        return new Decimal(Number(inputStr));
      }
      var x = new Decimal();
      x.array = [[inputLen - 1 + log10LongString(inputStr)]];
      x.sign = 1;
      x.layer = 0;
      return x.normalize();
    } else {
      throw Error(invalidArgument + "Expected BigInt");
    }
  };

  Q.fromHyperE = function (input) {
    if (typeof input !== "string") throw Error(invalidArgument + "Expected String");
    var s = input.trim();
    var negateIt = false;
    if (s[0] === "-") {
      negateIt = true;
      s = s.substring(1).trim();
    }
    if (s === "NaN" || s === "Infinity") {
      var x = new Decimal();
      x.array = [[s === "NaN" ? NaN : Infinity]];
      x.sign = negateIt ? -1 : 1;
      return x;
    }
    var count = 0;
    while (s[0] === "E") {
      count++;
      s = s.substring(1).trim();
      if (s[0] === "#") {
        s = s.substring(1);
      }
    }
    if (count === 0) {
      return Decimal.fromString((negateIt ? "-" : "") + s);
    }
    var x = new Decimal();
    if (count === 1) {
      x.array = [[Math.pow(10, Number(s))]];
    } else {
      x.array = [[Number(s)]];
      for (var i = 1; i < count; i++) x.array[0].push(i === count - 1 ? 1 : 0);
    }
    x.sign = negateIt ? -1 : 1;
    x.layer = 0;
    return x.normalize();
  };

  Q.fromString = function (input) {
    if (typeof input !== "string") throw Error(invalidArgument + "Expected String");

    try {
      var parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && parsed.array) {
        return Decimal.fromJSON(parsed);
      }
    } catch (e) {}

    var x = new Decimal();
    x.array = [[0]];
    x.sign = 1;
    x.layer = 0;

    var s = input.trim();
    if (s === "" || s === "0") {
      return x;
    }

    var negateIt = false;
    if (s[0] === "-" || s[0] === "+") {
      var signMatch = s.match(/^[-\+]+/);
      var signs = signMatch[0];
      negateIt = (signs.match(/-/g) || []).length % 2 === 1;
      s = s.substring(signMatch[0].length).trim();
    }

    if (s === "NaN") {
      x.array = [[NaN]];
      return x;
    }
    if (s === "Infinity") {
      x.array = [[Infinity]];
      x.sign = negateIt ? -1 : 1;
      return x;
    }

    var layerMatch = s.match(/^\u03C9\^(\d+)\s*/);
    if (layerMatch) {
      x.layer = parseInt(layerMatch[1], 10);
      s = s.substring(layerMatch[0].length).trim();
    }

    // Parse {m}ε{n} format (layer >= 11)
    var epsMatch = s.match(/^\{(\d+(?:\.\d+)?)\}\u03B5\{(\d+)\}\s*/);
    if (epsMatch) {
      x.layer = parseInt(epsMatch[2], 10);
      var epsCount = Number(epsMatch[1]);
      s = s.substring(epsMatch[0].length).trim();
      if (x.layer >= 11) {
        x.array[0] = [epsCount];
        if (epsCount >= 1 && isFinite(epsCount)) {
          x.array.push([epsCount, 0, 1]);
        }
      }
      if (negateIt) x.sign = -1;
      return x.normalize();
    }

    // Parse ε{n} format (layer with no count)
    var epsSimpleMatch = s.match(/^\u03B5\{(\d+)\}\s*/);
    if (epsSimpleMatch) {
      x.layer = parseInt(epsSimpleMatch[1], 10);
      s = s.substring(epsSimpleMatch[0].length).trim();
      if (negateIt) x.sign = -1;
      return x.normalize();
    }

    // Parse layer symbol + letter pattern + {n} format
    // (simple case: just {n} after symbol, no letters)
    var symSimpleMatch = s.match(/^([!@#\$%&~<>?])\{(\d+(?:\.\d+)?)\}\s*$/);
    if (symSimpleMatch) {
      var SYMBOL_LAYERS = {'!': 1, '@': 2, '#': 3, '$': 4, '%': 5, '&': 6, '~': 7, '<': 8, '>': 9, '?': 10};
      x.layer = SYMBOL_LAYERS[symSimpleMatch[1]] || 1;
      var symSimpleVal = Number(symSimpleMatch[2]);
      if (!isNaN(symSimpleVal) && isFinite(symSimpleVal)) {
        x.array[0] = [symSimpleVal];
      }
      if (negateIt) x.sign = -1;
      return x.normalize();
    }

    // Parse symbol + full letter pattern {n} (multi-letter like !AaBa{n}, handles ^N notation)
    var symParseMatch = s.match(/^([!@#\$%&~<>?])(.*?)\{(\d+(?:\.\d+)?)\}\s*$/);
    if (symParseMatch) {
      var SYMBOL_LAYERS3 = {'!': 1, '@': 2, '#': 3, '$': 4, '%': 5, '&': 6, '~': 7, '<': 8, '>': 9, '?': 10};
      x.layer = SYMBOL_LAYERS3[symParseMatch[1]] || 1;
      var symLetters2 = symParseMatch[2].trim();
      var symBase2 = Number(symParseMatch[3]);
      
      // Parse tokens: ordinal tokens have lowercase (Aa, Abc), finite ops are single uppercase
      var symTokens2 = [];
      var symFinOps = [];  // finite ops for r0
      var symTokRegex = /([A-Z][a-z]*)(?:\^(\d+))?/g;
      var symTokM;
      while ((symTokM = symTokRegex.exec(symLetters2)) !== null) {
        var tokName = symTokM[1];
        var tokCount = symTokM[2] ? parseInt(symTokM[2], 10) : 1;
        // Single uppercase letter (no lowercase) = finite op
        if (tokName.length === 1 && tokName[0] >= 'D') {
          // Finite operations start from E (level 1 = E, level 2 = F, ...)
          var finLevel = tokName.charCodeAt(0) - 68; // 68 = 'D', E->1, F->2, ...
          if (finLevel > 0) {
            symFinOps.push({level: finLevel, count: tokCount});
          }
        } else {
          symTokens2.push({name: tokName, count: tokCount});
        }
      }
      
      if (symTokens2.length === 0) {
        x.array[0] = [symBase2];
        if (negateIt) x.sign = -1;
        return x;
      }
      
      // Group consecutive identical tokens
      var symGroups2 = [];
      for (var ti = 0; ti < symTokens2.length; ti++) {
        if (symGroups2.length > 0 && symGroups2[symGroups2.length - 1].name === symTokens2[ti].name) {
          symGroups2[symGroups2.length - 1].count += symTokens2[ti].count;
        } else {
          symGroups2.push({name: symTokens2[ti].name, count: symTokens2[ti].count});
        }
      }
      
      var symRows2 = [];
      for (var gi3 = 0; gi3 < symGroups2.length; gi3++) {
        var g3 = symGroups2[gi3];
        var gName3 = g3.name;
        var gU3 = gName3[0];
        var gUIdx3 = gU3.charCodeAt(0) - 64;
        var gLower3 = gName3.slice(1);
        var gIndices3 = [];
        for (var li3 = 0; li3 < gLower3.length; li3++) {
          gIndices3.push(gLower3.charCodeAt(li3) - 97);
        }
        var gK3 = gIndices3.length;
        var gAllZero3 = true;
        var gFirstNonZero3 = -1;
        for (var li3 = 0; li3 < gK3; li3++) {
          if (gIndices3[li3] !== 0) {
            gAllZero3 = false;
            if (gFirstNonZero3 === -1) gFirstNonZero3 = li3;
          }
        }
        var gLastIsA3 = gIndices3[gK3 - 1] === 0;
        var gRow3 = [g3.count];
        var gIsDiag3 = false;
        
        if (gAllZero3) {
          for (var li3 = 0; li3 < gK3; li3++) gRow3.push(0);
          gRow3.push(gUIdx3);
        } else if (gLastIsA3 && gFirstNonZero3 >= 0) {
          gIsDiag3 = true;
          for (var li3 = gK3 - 1; li3 >= 0; li3--) {
            if (li3 === gK3 - 1) {
              gRow3.push(symBase2);
            } else if (li3 === gFirstNonZero3) {
              gRow3.push(gIndices3[li3] + 1);
            } else if (li3 < gFirstNonZero3) {
              gRow3.push(gIndices3[li3]);
            } else {
              gRow3.push(0);
            }
          }
          gRow3.push(gUIdx3);
        } else {
          for (var li3 = gK3 - 1; li3 >= 0; li3--) {
            gRow3.push(gIndices3[li3]);
          }
          gRow3.push(gUIdx3);
        }
        symRows2.push({
          row: gRow3,
          isDiag: gIsDiag3,
          lowerIndices: gIndices3,
          level: gUIdx3
        });
      }
      
      symRows2.sort(function(a, b) {
        if (a.level !== b.level) return a.level - b.level;
        var maxLen = Math.max(a.lowerIndices.length, b.lowerIndices.length);
        for (var ii = 0; ii < maxLen; ii++) {
          var va = ii < a.lowerIndices.length ? a.lowerIndices[ii] : 0;
          var vb = ii < b.lowerIndices.length ? b.lowerIndices[ii] : 0;
          if (va !== vb) return va - vb;
        }
        return 0;
      });
      
      x.array = [[symBase2]];
      // Apply finite ops to r0
      for (var fi = 0; fi < symFinOps.length; fi++) {
        var fo = symFinOps[fi];
        x.array[0][fo.level] = (x.array[0][fo.level] || 0) + fo.count;
      }
      // Handle special finite ops: F and E
      // F (level 2): F^count means tetration exponent count-2
      // E (level 1): E^count means exponent count
      // Higher levels (G, H, ...) are higher hyperoperation levels
      x._oaRowData = [];
      for (var gi3 = 0; gi3 < symRows2.length; gi3++) {
        x.array.push(symRows2[gi3].row);
        x._oaRowData.push({isDiag: symRows2[gi3].isDiag});
      }
      if (negateIt) x.sign = -1;
      return x.normalize();
    }

    var bracketPattern = /\[([^\]]*)\]/g;
    var match;
    var rowIndex = 0;

    while ((match = bracketPattern.exec(s)) !== null) {
      var nums = match[1].split(",");
      var row = [];
      for (var i = 0; i < nums.length; i++) {
        var raw = nums[i].trim();
        if (raw[0] === '[') raw = raw.substring(1);
        if (raw[raw.length - 1] === ']') raw = raw.substring(0, raw.length - 1);
        var n = Number(raw);
        if (!isNaN(n) && isFinite(n)) {
          row.push(n);
        } else {
          row.push(0);
        }
      }
      if (rowIndex === 0) {
        x.array[0] = row;
      } else {
        x.array.push(row);
      }
      rowIndex++;
      if (rowIndex >= Decimal.maxRows) break;
    }

    if (rowIndex > 1) {
      x.layer = 1;
    }

    if (rowIndex === 0) {
      var rem = s;

      var tetrMatch = rem.match(/^(\d+(?:\.\d+)?)\s*\^\^\s*(\d+(?:\.\d+)?)\s*$/);
      if (tetrMatch) {
        var tetrBase = Number(tetrMatch[1]);
        var tetrHeight = Number(tetrMatch[2]);
        if (!isNaN(tetrBase) && !isNaN(tetrHeight) && isFinite(tetrHeight) && tetrHeight >= 0 && tetrHeight === Math.floor(tetrHeight)) {
          if (tetrHeight === 0) {
            x.array = [[1]];
          } else if (tetrHeight === 1) {
            x.array = [[tetrBase]];
          } else {
            var tetrResult = Decimal.pow(tetrBase, new Decimal(tetrBase));
            for (var ti = 3; ti <= tetrHeight; ti++) {
              tetrResult = Decimal.pow(tetrBase, tetrResult);
            }
            x.array = deepCloneArray(tetrResult.array);
            x.sign = tetrResult.sign;
            x.layer = tetrResult.layer;
          }
          if (negateIt) x.sign = -1;
          return x.normalize();
        }
      }

      var coeffEMatch = rem.match(/^(\d+(?:\.\d+)?)\s*[Ee]\s*(\d+(?:\.\d+)?)\s*$/);
      if (coeffEMatch) {
        var coeff = Number(coeffEMatch[1]);
        var exp = Number(coeffEMatch[2]);
        if (!isNaN(coeff) && !isNaN(exp) && isFinite(exp) && coeff > 0) {
          x.array[0] = [exp + Math.log10(coeff), 1];
          x.sign = negateIt ? -1 : 1;
          x.layer = 0;
          return x.normalize();
        }
      }

      var aaMatch = rem.match(/^(\d+)Aa(\d+)/i);
      if (aaMatch) {
        var aaCount = aaMatch[1] ? Number(aaMatch[1]) : 1;
        var aaN = Number(aaMatch[2]);
        if (!isNaN(aaN) && isFinite(aaN) && aaN >= 1 && aaN === Math.floor(aaN)) {
          if (aaN < Decimal.maxCols) {
            x.array[0] = [10];
            x.array[0][aaN] = aaCount;
          } else {
            x.array = [[10], [aaCount, aaN]];
          }
          if (negateIt) x.sign = -1;
          return x.normalize();
        }
      }

      var oaMatch = rem.match(/^((?:[A-Z][a-z]+)+)(\d+)/);
      if (oaMatch) {
        var oaFullPrefix = oaMatch[1];
        var oaN = Number(oaMatch[2]);
        if (!isNaN(oaN) && isFinite(oaN) && oaN >= 1 && oaN === Math.floor(oaN)) {
          var oaTokens = [];
          var oaTokenRegex = /[A-Z][a-z]+/g;
          var oaTm;
          while ((oaTm = oaTokenRegex.exec(oaFullPrefix)) !== null) {
            oaTokens.push(oaTm[0]);
          }

          var oaGroups = [];
          for (var ti = 0; ti < oaTokens.length; ti++) {
            if (oaGroups.length > 0 && oaGroups[oaGroups.length - 1].token === oaTokens[ti]) {
              oaGroups[oaGroups.length - 1].count++;
            } else {
              oaGroups.push({token: oaTokens[ti], count: 1});
            }
          }

          var oaRows = [];
          for (var gi = 0; gi < oaGroups.length; gi++) {
            var g = oaGroups[gi];
            var gU = g.token[0];
            var gUIdx = gU.charCodeAt(0) - 64;
            var gLower = g.token.slice(1);
            var gIndices = [];
            for (var li = 0; li < gLower.length; li++) {
              gIndices.push(gLower.charCodeAt(li) - 97);
            }
            var gK = gIndices.length;
            var gAllZero = true;
            var gFirstNonZero = -1;
            for (var li = 0; li < gK; li++) {
              if (gIndices[li] !== 0) {
                gAllZero = false;
                if (gFirstNonZero === -1) gFirstNonZero = li;
              }
            }
            var gLastIsA = gIndices[gK - 1] === 0;
            var gRow = [g.count];
            var gIsDiag = false;

            if (gAllZero) {
              for (var li = 0; li < gK; li++) gRow.push(0);
              gRow.push(gUIdx);
            } else if (gLastIsA && gFirstNonZero >= 0) {
              gIsDiag = true;
              for (var li = gK - 1; li >= 0; li--) {
                if (li === gK - 1) {
                  gRow.push(oaN);
                } else if (li === gFirstNonZero) {
                  gRow.push(gIndices[li] + 1);
                } else if (li < gFirstNonZero) {
                  gRow.push(gIndices[li]);
                } else {
                  gRow.push(0);
                }
              }
              gRow.push(gUIdx);
            } else {
              for (var li = gK - 1; li >= 0; li--) {
                gRow.push(gIndices[li]);
              }
              gRow.push(gUIdx);
            }
            oaRows.push({
              row: gRow,
              isDiag: gIsDiag,
              lowerIndices: gIndices,
              level: gUIdx
            });
          }

          oaRows.sort(function(a, b) {
            if (a.level !== b.level) return a.level - b.level;
            var maxLen = Math.max(a.lowerIndices.length, b.lowerIndices.length);
            for (var i = 0; i < maxLen; i++) {
              var va = i < a.lowerIndices.length ? a.lowerIndices[i] : 0;
              var vb = i < b.lowerIndices.length ? b.lowerIndices[i] : 0;
              if (va !== vb) return va - vb;
            }
            return 0;
          });

          x.array = [[oaN]];
          x._oaRowData = [];
          for (var gi = 0; gi < oaRows.length; gi++) {
            x.array.push(oaRows[gi].row);
            x._oaRowData.push({isDiag: oaRows[gi].isDiag});
          }
          x.layer = 1;
          if (negateIt) x.sign = -1;
          return x.normalize();
        }
      }

      if (/^[A-Z]+/i.test(rem)) {
        var prefixMatch = rem.match(/^([A-Z]+)/i);
        var prefix = prefixMatch[0].toUpperCase();
        rem = rem.substring(prefixMatch[0].length).trim();
        var val = Number(rem);
        if (!isNaN(val) && isFinite(val)) {
          var counts = {};
          var maxIdx = 0;
          for (var i = 0; i < prefix.length; i++) {
            var letterPos = prefix.charCodeAt(i) - 64;
            if (letterPos >= 5) {
              var idx = letterPos - 4;
              counts[idx] = (counts[idx] || 0) + 1;
              maxIdx = Math.max(maxIdx, idx);
            }
          }
          x.array[0] = [val];
          var eCount = counts[1] || 0;
          var fCount = counts[2] || 0;
          if (fCount > 0 && eCount === 0 && fCount === 1 && maxIdx === 2 && val >= 0 && val === Math.floor(val)) {
            if (val === 0) {
              x.array = [[1]];
            } else if (val === 1) {
              x.array = [[10]];
            } else {
              x.array[0] = [10000000000, val - 2];
            }
          } else if (maxIdx === 1) {
            x.array[0][1] = eCount;
          } else {
            for (var idx = 1; idx <= maxIdx; idx++) {
              x.array[0][idx] = counts[idx] || 0;
            }
          }
          if (negateIt) x.sign = -1;
          return x.normalize();
        }
      }

      var num = Number(rem);
      if (!isNaN(num) && isFinite(num)) {
        x.array[0][0] = num;
      }
    }

    if (negateIt) x.sign = -1;
    return x.normalize();
  };

  P.clone = function () {
    var x = new Decimal();
    x.array = deepCloneArray(this.array);
    x.sign = this.sign;
    x.layer = this.layer;
    return x;
  };

  function objectCreate() {
    var x = {};
    x.array = [[0]];
    x.sign = 1;
    x.layer = 0;
    return x;
  }

  function clone(obj) {
    var i, p, ps;
    function Decimal(input, input2, input3) {
      var x = this;
      if (!(x instanceof Decimal)) return new Decimal(input, input2, input3);
      x.constructor = Decimal;

      if (input === undefined || input === null) {
        x.array = [[0]];
        x.sign = 1;
        x.layer = 0;
        return x;
      }

      var parsedObject = null;
      if (typeof input === "string" && (input[0] === "[" || input[0] === "{")) {
        try {
          parsedObject = JSON.parse(input);
        } catch (e) {}
      }

      var temp;
      if (typeof input === "number" && input2 === undefined) {
        temp = objectCreate();
        temp.array = [[Math.abs(input)]];
        temp.sign = input < 0 ? -1 : 1;
        temp.layer = 0;
        temp.normalize = P.normalize;
        temp = temp.normalize();
      } else if (parsedObject) {
        temp = Q.fromObject(parsedObject);
      } else if (typeof input === "string") {
        temp = Q.fromString(input);
      } else if (Array.isArray(input)) {
        temp = Q.fromArray(input, input2, input3);
      } else if (input instanceof Decimal) {
        temp = input;
      } else if (typeof input === "object" && input !== null) {
        temp = Q.fromObject(input);
      } else {
        temp = objectCreate();
        var num = Number(input);
        if (!isNaN(num) && isFinite(num)) {
          temp.array = [[Math.abs(num)]];
          temp.sign = num < 0 ? -1 : 1;
          temp.layer = 0;
          temp.normalize = P.normalize;
          temp = temp.normalize();
        } else if (isNaN(num)) {
          temp.array = [[NaN]];
        } else {
          temp.array = [[Infinity]];
          temp.sign = num < 0 ? -1 : 1;
        }
      }

      x.array = deepCloneArray(temp.array);
      x.sign = temp.sign;
      x.layer = temp.layer;
      if (temp._oaIsDiag !== undefined) x._oaIsDiag = temp._oaIsDiag;
      if (temp._oaRowData !== undefined) x._oaRowData = temp._oaRowData.map(function(d) { return {isDiag: d.isDiag}; });

      return x;
    }

    Decimal.prototype = P;

    Decimal.JSON = 0;
    Decimal.STRING = 1;

    Decimal.NONE = 0;
    Decimal.NORMAL = 1;
    Decimal.ALL = 2;

    // expandOrdinals: Generate all Cantor normal form terms below a given ordinal level
    // cantorLevel: determines max nesting depth (diag range and numVals range)
    // maxVal: determines value range (0..maxVal) for each position
    // Returns array of ordinal rows [[1, v0, diag], [1, v0, v1, diag], ...]
    Decimal.expandOrdinals = function (cantorLevel, maxVal) {
      var rows = [];
      var maxRows = Decimal.maxCols - 1; // 99

      if (cantorLevel < 0) cantorLevel = 0;

      // Generate all combinations: numVals outer, diag inner (for increasing ordinal value)
      // Order: nv=1(d=1..cantorLevel), nv=2(d=1..cantorLevel), ..., plus special row
      for (var nv = 1; nv <= cantorLevel && rows.length < maxRows; nv++) {
        for (var d = 1; d <= cantorLevel && rows.length < maxRows; d++) {
          var total = Math.pow(maxVal + 1, nv);
          for (var ci = 0; ci < total && rows.length < maxRows; ci++) {
            var vals = [];
            var tmp = ci;
            for (var k = 0; k < nv; k++) {
              vals.push(tmp % (maxVal + 1));
              tmp = Math.floor(tmp / (maxVal + 1));
            }
            var row = [1];
            for (var k = 0; k < nv; k++) row.push(vals[k]);
            row.push(d);
            rows.push(row);
          }
        }
      }

      // Add boundary/special row [1, 0, ..., 0, 1] with (cantorLevel+1) zeros + diag=1
      // For cantorLevel=0: generates the sole row [[1,0,1]] (1 zero)
      // For cantorLevel>=2: adds the terminal row [1, 0, ..., 0, 1] with cantorLevel+1 zeros
      // For cantorLevel=1: skip (not needed)
      if ((cantorLevel === 0 || cantorLevel >= 2) && rows.length < maxRows) {
        var bRow = [1];
        var zeroCount = (cantorLevel === 0) ? 1 : (cantorLevel + 1);
        for (var k = 0; k < zeroCount; k++) bRow.push(0);
        bRow.push(1);
        rows.push(bRow);
      }

      return rows;
    };

    // getCantorLevel: map operation level to expandOrdinals cantorLevel
    // v0 values: 0=ω+1, 1=ω*2+1, 2=ω*3+1, 3-5=ω^ω range,
    //            6=ω^2+1, 7=ω^2+ω, 8=ω^2+ω+1, 9=ω^2*2,
    //            10=ω^3, 11=ω^3+1, ...
    Decimal.getCantorLevel = function (levelN) {
      // For now, simple mapping based on known cases
      if (levelN <= 0) return 0;     // ω+1: expande
      if (levelN <= 2) return 1;     // ω*2+1 through ω*3+1
      if (levelN <= 5) return 1;     // ω^ω diagonalization range
      if (levelN <= 9) return 1;     // ω^2 range
      if (levelN <= 11) return 2;    // ω^3 range
      // Default: use levelN / some factor
      return Math.min(Math.floor(levelN / 5) + 1, Decimal.maxCols);
    };

    Decimal.clone = clone;
    Decimal.config = Decimal.set = config;

    for (var prop in Q) {
      if (Q.hasOwnProperty(prop)) {
        Decimal[prop] = Q[prop];
      }
    }

    if (obj === void 0) obj = {};
    if (obj) {
      ps = ['maxRows', 'maxCols', 'maxArrow', 'serializeMode', 'debug'];
      for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
    }

    Decimal.config(obj);

    return Decimal;
  }

  function defineConstants(obj) {
    for (var prop in R) {
      if (R.hasOwnProperty(prop)) {
        var val = R[prop];
        if (typeof val === "string") {
          obj[prop] = val;
        } else if (Object.defineProperty) {
          Object.defineProperty(obj, prop, {
            configurable: false,
            enumerable: true,
            writable: false,
            value: new Decimal(val)
          });
        } else {
          obj[prop] = new Decimal(val);
        }
      }
    }
    return obj;
  }

  function config(obj) {
    if (!obj || typeof obj !== 'object') {
      throw Error(DecimalError + 'Object expected');
    }
    var i, p, v,
      ps = [
        'maxRows', 1, 1000,
        'maxCols', 1, 1000,
        'maxArrow', 1, Number.MAX_SAFE_INTEGER,
        'serializeMode', 0, 1,
        'debug', 0, 2
      ];
    for (i = 0; i < ps.length; i += 3) {
      if ((v = obj[p = ps[i]]) !== void 0) {
        if (Math.floor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
        else throw Error(invalidArgument + p + ': ' + v);
      }
    }
    return this;
  }

  Decimal = clone(Decimal);
  Decimal = defineConstants(Decimal);
  Decimal['default'] = Decimal.Decimal = Decimal;

  if (typeof define == 'function' && define.amd) {
    define(function () {
      return Decimal;
    });
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = Decimal;
  } else {
    if (!globalScope) {
      globalScope = typeof self != 'undefined' && self && self.self == self
        ? self : Function('return this')();
    }
    globalScope.Decimal = Decimal;
  }
})(this);