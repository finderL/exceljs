/**
 * Copyright (c) 2014 Guyon Roche
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
"use strict";

var _ = require("underscore");

// Column defines the column properties for 1 column.
// This includes header rows, widths, key, (style), etc.
// Worksheet will condense the columns as appropriate during serialization
var Column = module.exports = function(worksheet, number, defn) {
    this._worksheet = worksheet;
    this._number = number;
    if (defn !== false) {
        // sometimes defn will follow
        this.defn = defn;
    }
}

Column.prototype = {
    get number() {
        return this._number;
    },
    get defn() {
        return {
            header: this._header,
            key: this.key,
            width: this.width,
            style: this.style
        };
    },
    set defn(value) {
        if (value) {
            this.key = value.key;
            this.width = value.width;
            if (value.style) { this.style = value.style; }
            else { this.style = {} };
            
            // headers must be set after style
            this.header = value.header;
        } else {
            delete this._header;
            delete this.key;
            delete this.width;
            this.style = {};
        }
    },
    get headers() {
        return this._header && (this._header instanceof Array) ? this._header : [this._header];
    },
    get header() {
        return this._header;
    },
    set header(value) {
        if (value != undefined) {
            var self = this;
            this._header = value;
            _.each(this.headers, function(text, index) {
                self._worksheet.getCell(index + 1, self.number).value = text;
            });
        } else {
            this._header = [];
        }
        return value;
    },
    get key() {
        return this._key;
    },
    set key(value) {
        if (this._key) {
            delete this._worksheet._keys[this._key];
        }
        this._key = value;
        if (value) {
            this._worksheet._keys[this._key] = this;
        }
        return value;
    },
    toString: function() {
        return JSON.stringify({
            key: this.key,
            width: this.width,
            headers: this.headers.length ? this.headers : undefined
        });
    },
    equivalentTo: function(other) {
        return
            (this.width == other.width) &&
            _.isEqual(this.style, other.style);
    },
    get isDefault() {
        if ((this.width !== undefined) && (this.width !== 8)) {
            return false;
        }
        var s = this.style;
        if (s && (s.font || s.numFmt || s.alignment || s.border || s.fill)) {
            return false;
        }
        return true;
    },
    get headerCount() {
        return this.headers.length;
    },
    
    eachCell: function(options, iteratee) {
        var colNumber = this.number;
        if (!iteratee) {
            iteratee = options;
            options = null;
        }
        if (options && options.includeEmpty) {
            this._worksheet.eachRow(options, function(row, rowNumber) {
                iteratee(row.getCell(colNumber), rowNumber);
            });
        } else {
            this._worksheet.eachRow(function(row, rowNumber) {
                var cell = row.findCell(colNumber);
                if (cell) {
                    iteratee(cell, rowNumber);
                }
            });
        }
    },
    
    // =========================================================================
    // styles
    _applyStyle: function(name, value) {
        this.style[name] = value;
        this.eachCell(function(cell) {
            cell[name] = value;
        });
        return value;
    },
    
    get numFmt() {
        return this.style.numFmt;
    },
    set numFmt(value) {
        return this._applyStyle("numFmt", value);
    },
    get font() {
        return this.style.font;
    },
    set font(value) {
        return this._applyStyle("font", value);
    },
    get alignment() {
        return this.style.alignment;
    },
    set alignment(value) {
        return this._applyStyle("alignment", value);
    },
    get border() {
        return this.style.border;
    },
    set border(value) {
        return this._applyStyle("border", value);
    },
    get fill() {
        return this.style.fill;
    },
    set fill(value) {
        return this._applyStyle("fill", value);
    }
}
