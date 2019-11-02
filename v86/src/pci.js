"use strict";

var
/** @const */  PCI_VENDOR_ID =		0x00	/* 16 bits */
/** @const */ ,PCI_DEVICE_ID =		0x02	/* 16 bits */
/** @const */ ,PCI_COMMAND =		0x04	/* 16 bits */
/** @const */ ,PCI_BASE_ADDRESS_0 =	0x10	/* 32 bits */
/** @const */ ,PCI_BASE_ADDRESS_1 =	0x14	/* 32 bits [htype 0,1 only] */
/** @const */ ,PCI_BASE_ADDRESS_2 =	0x18	/* 32 bits [htype 0 only] */
/** @const */ ,PCI_BASE_ADDRESS_3 =	0x1c	/* 32 bits */
/** @const */ ,PCI_BASE_ADDRESS_4 =	0x20	/* 32 bits */
/** @const */ ,PCI_BASE_ADDRESS_5 =	0x24	/* 32 bits */
/** @const */ ,PCI_INTERRUPT_LINE =	0x3c	/* 8 bits */
/** @const */ ,PCI_CLASS_REVISION =	0x08;	/* High 24 bits are class, low 8 revision */

var
/** @const */ PCI_CONFIG_ADDRESS = 0xCF8,
/** @const */ PCI_CONFIG_DATA = 0xCFC;

/**
 * @constructor
 * @param {CPU} cpu
 */
function PCI(cpu)
{
    this.pci_addr = new Uint8Array(4);
    this.pci_value = new Uint8Array(4);
    this.pci_response = new Uint8Array(4);
    this.pci_status = new Uint8Array(4);

    this.pci_addr32 = new Int32Array(this.pci_addr.buffer);
    this.pci_value32 = new Int32Array(this.pci_value.buffer);
    this.pci_response32 = new Int32Array(this.pci_response.buffer);
    this.pci_status32 = new Int32Array(this.pci_status.buffer);

    this.device_spaces = Array(0x10000);
    this.devices = Array(0x10000);

    /*
    cpu.io.register_write(0xCF9, function(value)
    {
        dbg_log("PCI reboot: " + h(value, 2), LOG_PCI);

        // PCI reboot
        if(value & 6)
        {
            cpu_restart();
        }
    });*/

    cpu.io.register_write_consecutive(PCI_CONFIG_DATA, this,
        function(out_byte)
        {
            dbg_log("PCI data0: " + h(out_byte, 2) + " addr=" + h(this.pci_addr32[0] >>> 0), LOG_PCI);
            this.pci_value[0] = out_byte;
        },
        function(out_byte)
        {
            dbg_log("PCI data1: " + h(out_byte, 2) + " addr=" + h(this.pci_addr32[0] >>> 0), LOG_PCI);
            this.pci_value[1] = out_byte;
        },
        function(out_byte)
        {
            dbg_log("PCI data2: " + h(out_byte, 2) + " addr=" + h(this.pci_addr32[0] >>> 0), LOG_PCI);
            this.pci_value[2] = out_byte;
        },
        function(out_byte)
        {
            dbg_log("PCI data3: " + h(out_byte, 2) + " addr=" + h(this.pci_addr32[0] >>> 0), LOG_PCI);
            this.pci_value[3] = out_byte;
            this.pci_write();
        }
    );

    cpu.io.register_read_consecutive(PCI_CONFIG_DATA, this,
        function()
        {
            return this.pci_response[0];
        },
        function()
        {
            return this.pci_response[1];
        },
        function()
        {
            return this.pci_response[2];
        },
        function()
        {
            return this.pci_response[3];
        }
    );

    cpu.io.register_read_consecutive(PCI_CONFIG_ADDRESS, this,
        function()
        {
            return this.pci_status[0];
        },
        function()
        {
            return this.pci_status[1];
        },
        function()
        {
            return this.pci_status[2];
        },
        function()
        {
            return this.pci_status[3];
        }
    );

    cpu.io.register_write_consecutive(PCI_CONFIG_ADDRESS, this,
        function(out_byte)
        {
            this.pci_addr[0] = out_byte;
        },
        function(out_byte)
        {
            this.pci_addr[1] = out_byte;
        },
        function(out_byte)
        {
            this.pci_addr[2] = out_byte;
        },
        function(out_byte)
        {
            this.pci_addr[3] = out_byte;
            this.pci_query();
        }
    );


    // Some experimental PCI devices taken from my PC:

    // 00:00.0 Host bridge: Intel Corporation 4 Series Chipset DRAM Controller (rev 02)
    //var host_bridge = {
    //    pci_id: 0,
    //    pci_space: [
    //        0x86, 0x80, 0x20, 0x2e, 0x06, 0x00, 0x90, 0x20, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00,
    //        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    //        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x43, 0x10, 0xd3, 0x82,
    //        0x00, 0x00, 0x00, 0x00, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    //    ],
    //    pci_bars: [],
    //};

    var host_bridge = {
        pci_id: 0,
        pci_space: [
            // 00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)
            0x86, 0x80, 0x37, 0x12, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ],
        pci_bars: [],
    };
    this.register_device(host_bridge);

    var isa_bridge = {
        pci_id: 1 << 3,
        pci_space: [
            // 00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
            0x86, 0x80, 0x00, 0x70, 0x07, 0x00, 0x00, 0x02, 0x00, 0x00, 0x01, 0x06, 0x00, 0x00, 0x80, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ],
        pci_bars: [],
    };
    this.register_device(isa_bridge);

    // 00:1e.0 PCI bridge: Intel Corporation 82801 PCI Bridge (rev 90)
    //this.register_device([
    //    0x86, 0x80, 0x4e, 0x24, 0x07, 0x01, 0x10, 0x00, 0x90, 0x01, 0x04, 0x06, 0x00, 0x00, 0x01, 0x00,
    //    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x05, 0x20, 0xe0, 0xe0, 0x80, 0x22,
    //    0xb0, 0xfe, 0xb0, 0xfe, 0xf1, 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    //    0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x02, 0x00,
    //], 0x1e << 3);
}

PCI.prototype.get_state = function()
{
    var state = [];

    state[0] = this.pci_addr;
    state[1] = this.pci_value;
    state[2] = this.pci_response;
    state[3] = this.pci_status;

    return state;
};

PCI.prototype.set_state = function(state)
{
    this.pci_addr.set(state[0]);
    this.pci_value.set(state[1]);
    this.pci_response.set(state[2]);
    this.pci_status.set(state[3]);
};

PCI.prototype.pci_query = function()
{
    var dbg_line = "";

    // Bit | .31                     .0
    // Fmt | EBBBBBBBBDDDDDFFFRRRRRR00

    var bdf = this.pci_addr[2] << 8 | this.pci_addr[1],
        addr = this.pci_addr[0] & 0xFC,
        //devfn = bdf & 0xFF,
        //bus = bdf >> 8,
        dev = bdf >> 3 & 0x1F,
        //fn = bdf & 7,
        enabled = this.pci_addr[3] >> 7;

    dbg_line += "enabled=" + (enabled);
    dbg_line += " bdf=" + h(bdf, 4);
    dbg_line += " dev=" + h(dev, 4);
    dbg_line += " addr=" + h(addr, 2);

    var device = this.device_spaces[bdf];

    if(device !== undefined)
    {
        this.pci_status32[0] = 0x80000000 | 0;

        if(addr < device.byteLength)
        {
            this.pci_response32[0] = device[addr >> 2];
        }
        else
        {
            // required by freebsd-9.1
            this.pci_response32[0] = 0;
        }

        dbg_line += " " + h(this.pci_addr32[0] >>> 0, 8) + " -> " + h(this.pci_response32[0] >>> 0, 8);

        if(addr >= device.byteLength)
        {
            dbg_line += " (undef)";
        }

        dbg_log(dbg_line, LOG_PCI);
    }
    else
    {
        this.pci_response32[0] = -1;
        this.pci_status32[0] = 0;
    }
};

PCI.prototype.pci_write = function()
{
    var bdf = this.pci_addr[2] << 8 | this.pci_addr[1],
        addr = this.pci_addr[0] & 0xFC;

    var space = this.device_spaces[bdf],
        device = this.devices[bdf];

    if(!space)
    {
        return;
    }

    if(addr >= 0x10 && addr < 0x28)
    {
        var written = this.pci_value32[0];

        var bar_nr = addr - 0x10 >> 2;
        var bar = device.pci_bars[bar_nr];

        //dbg_log("BAR" + bar_nr + " changed to " + h(space[addr >> 2] >>> 0) + " dev=" + h(bdf >> 3, 2), LOG_PCI);
        dbg_log("BAR" + bar_nr + " changed to " + h(written >>> 0) + " dev=" + h(bdf >> 3, 2), LOG_PCI);

        if(bar)
        {
            if((written | 3)  === -1)
            {
                space[addr >> 2] = ~(bar.size - 1);
            }
            else
            {
                // changing isn't supported yet, reset to default
                space[addr >> 2] = device.current_bars[bar_nr];
            }

            dbg_log("BAR <- " + h(space[addr >> 2] >>> 0), LOG_PCI);
            dbg_assert(!(bar.size & bar.size - 1));
        }
        else
        {
            space[addr >> 2] = 0;
        }
    }
};

PCI.prototype.register_device = function(device)
{
    dbg_assert(device.pci_id !== undefined);
    dbg_assert(device.pci_space !== undefined);
    dbg_assert(device.pci_bars !== undefined);

    var device_id = device.pci_id;

    dbg_log("PCI register bdf=" + h(device_id), LOG_PCI);

    dbg_assert(!this.devices[device_id]);
    dbg_assert(device.pci_space.length >= 64);

    // convert bytewise notation from lspci to double words
    var space = new Int32Array(new Uint8Array(device.pci_space).buffer);
    this.device_spaces[device_id] = space;
    this.devices[device_id] = device;

    // copy the bars so they can be restored later
    device.current_bars = new Int32Array(6);
    device.current_bars.set(space.subarray(4, 10));
};
