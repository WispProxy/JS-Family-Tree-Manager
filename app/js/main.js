
'use strict';



/********************************************
 *  Create Functions for Family Tree Manager
 ********************************************/
/**
 * Family Tree Manager
 *
 * @constructor
 */
function FamilyTreeManager ()
{
	this.originX                = 0;
	this.maxX                   = 0;
	this.shiftX                 = 0;

	/**
	 * SVG canvas
	 * @type {null}
	 */
	this.paper                  = null;
	/**
	 * Clicked Id for Person
	 * @type {null}
	 */
	this.clickedLinePersonId    = null;

	/**
	 * Array for Person
	 * @type {Array}
	 */
	this.data                   = [];
	/**
	 * Object for HighLight structure
	 * @type {{}}
	 */
	this.highlight              = {};
}

/**
 * Prototype based on Family Tree Manager
 *
 * @type {{lineSeparationX: number, lineSize: number, yearInPixels: number, linkLineSize: number, lineColor: string,
 *     dotAndTextColor: string, highlightColor: string, init: Function, showForm: Function, hideForm: Function,
 *     editPerson: Function, setFormValues: Function, getFormValues: Function, draw: Function, onPersonClick: Function,
 *     getData: Function, getParentIndex: Function, sortData: Function, linkToParent: Function, createDelegate:
 *     Function, formatDate: Function}}
 */
FamilyTreeManager.prototype = {
	lineSeparationX:            10,
	lineSize:                   20,
	yearInPixels:               20,
	linkLineSize:               4,

	lineColor:                  '#1b80e4',
	dotAndTextColor:            '#ffffff',
	highlightColor:             '#ff6d00',

	init: function ()
	{
		$('#details').submit(
						this.createDelegate(
							this.editPerson,
							this
						)
					);

		$('#add').click(
						this.createDelegate(
							this.showForm,
							this
						)
				);
		$('#data').click(
						this.createDelegate(
							this.getData,
							this
						)
				);
		$('#cancel').click(
						this.createDelegate(
							this.hideForm,
							this
						)
					);

		this.getData();
	},
	showForm: function (_person)
	{
		var i,
			dataLength,
			otherPerson,
			$idOptionThemplate;

		/**
		 *  TODO:_This_need_refactor!
		 */
		$('#details option[value]').remove();

		for (i = 0, dataLength = this.data.length; i < dataLength; i++)
		{
			otherPerson         = this.data[ i ];
			$idOptionThemplate  = $('#optionTemplate');

			if (otherPerson != _person)
			{
				/**
				 *  TODO:_This_need_refactor!
				 */
				$idOptionThemplate.clone().removeAttr('id').val(otherPerson.id).text(otherPerson.toString())
					.appendTo('#father');
				$idOptionThemplate.clone().removeAttr('id').val(otherPerson.id).text(otherPerson.toString())
					.appendTo('#mother');
			}
		}

		if (_person)
		{
			this.setFormValues(
				{
					id:         _person.id,
					name:       _person.name,
					birth:      _person.birth,
					death:      _person.death,
					father:     _person.father,
					mother:     _person.mother
				}
			);
		}
		else
		{
			this.setFormValues(
				{
					id:         '',
					name:       '',
					birth:      '',
					death:      '',
					father:     '',
					mother:     ''
				}
			);
		}

		$('#add').hide();
		$('#edit').hide();
		$('#data').hide();
		$('#details').show();
	},
	hideForm: function ()
	{
		$('#details').hide();
		$('#add').show();
		$('#data').show();

		this.onPersonClick(null);
	},
	editPerson: function ()
	{
		var formValues,
			i,
			dataLength;

		formValues  = this.getFormValues();

		if (formValues.id)
		{
			for (i = 0, dataLength = this.data.length; i < dataLength; i++)
			{
				if (this.data[ i ].id == formValues.id)
				{
					this.data[ i ].name     = formValues.name;
					this.data[ i ].birth    = formValues.birth;
					this.data[ i ].death    = formValues.death;
					this.data[ i ].father   = formValues.father;
					this.data[ i ].mother   = formValues.mother;
					break;
				}
			}
		}
		else
		{
			this.data.push(
				new Person(
					(this.data.length + 1),
					formValues.name,
					formValues.birth,
					formValues.death,
					formValues.father,
					formValues.mother
				)
			);
		}

		this.hideForm();

		this.draw();

		return false;
	},
	setFormValues: function (_values)
	{
		$('#id')
			.val(_values.id || '');
		$('#name')
			.val(_values.name || '');
		$('#birth')
			.val(this.formatDate(_values.birth) || '');
		$('#death')
			.val(this.formatDate(_values.death) || '');
		$('#father')
			.val(_values.father || '');
		$('#mother')
			.val(_values.mother || '');
	},
	getFormValues: function ()
	{
		var father      = $('#father').val(),
			mother      = $('#mother').val();

		return {
			id:         $('#id').val(),
			name:       $('#name').val(),
			birth:      $('#birth').attr('valueAsDate'),
			death:      $('#death').attr('valueAsDate') || null,
			father:     (father === 'Father') ? null : father,
			mother:     (mother === 'Mother') ? null : mother
		};
	},
	draw: function ()
	{
		var paper,
			i,
			dataLength,
			line,
			d,
			x,
			y,
			person,
			birthYear,
			width,
			text;

		this.data.sort(this.sortData);

		this.originX                = ( this.yearInPixels * this.data[ 0 ].birth.getFullYear() );

		this.shiftX                 = 0;
		this.highlight              = {};
		this.clickedLinePersonId    = null;

		d           = new Date();
		this.maxX   = (this.yearInPixels * (d.getFullYear() + 1) + this.data.length * this.linkLineSize);

		$('#canvas').empty();

		this.paper  = Raphael(
						'canvas',
						( this.maxX - this.originX ),
						( this.data.length * (this.lineSeparationX + this.lineSize) )
					);

		for (i = 0, dataLength = this.data.length; i < dataLength; i++)
		{
			person      = this.data[ i ];
			birthYear   = person.birth.getFullYear();

			if ( ( i > 0 ) && ( birthYear === this.data[ i - 1 ].birth.getFullYear() ) )
			{
				this.shiftX += this.linkLineSize;
			}

			this.highlight[ person.id ] = [];

			x       = this.yearInPixels * birthYear - this.originX + this.shiftX;
			y       = i * (this.lineSeparationX + this.lineSize);

			width   = (
						person.death ?
						( this.yearInPixels * (person.death.getFullYear() - birthYear) ) :
						(this.maxX - this.yearInPixels * birthYear)
					);

			line    = this.paper.rect(
								x,
								y,
								width,
								this.lineSize
							);

			line.attr('fill', this.lineColor);
			line.attr('stroke', this.lineColor);

			this.highlight[ person.id ].push(line);

			if (width > 100)
			{
				text = this.paper.text(
									x + this.linkLineSize,
									y + this.lineSize / 2,
									person.toString()
								);

				text.attr('text-anchor', 'start');
				text.attr('fill', this.dotAndTextColor);
			}
			else
			{
				text = this.paper.text(
									x - this.linkLineSize,
									y + this.lineSize / 2,
									person.toString()
								);

				text.attr('text-anchor', 'end');
				text.attr('fill', this.lineColor);
			}

			line.node.onclick = this.createDelegate(
										this.onPersonClick,
										this,
										[ person ]
									);

			this.linkToParent(i, 'father', x);
			this.linkToParent(i, 'mother', x);
		}

		$('#add').show();
		$('#data').show();
	},
	onPersonClick: function (_person)
	{
		var i,
			dataLength,
			highlights;

		if (this.clickedLinePersonId !== null)
		{
			highlights = this.highlight[ this.clickedLinePersonId ];

			for (i = 0, dataLength = highlights.length; i < dataLength; i++)
			{
				highlights[ i ].attr('fill', this.lineColor);
				highlights[ i ].attr('stroke', this.lineColor);
			}
		}

		if (_person && this.clickedLinePersonId !== _person.id)
		{
			highlights = this.highlight[ _person.id ];

			for (i = 0, dataLength = highlights.length; i < dataLength; i++)
			{
				highlights[ i ].attr('fill', this.highlightColor);
				highlights[ i ].attr('stroke', this.highlightColor);
			}

			this.clickedLinePersonId = _person.id;

			$('#edit').click(this.createDelegate(this.showForm, this, [ _person ])).show();
			$('#add').hide();
		}
		else
		{
			this.clickedLinePersonId = null;

			$('#edit').hide();

			if (_person)
			{
				this.hideForm();
			}
		}
	},
	getData: function ()
	{
		var i,
			dataLength,
			newData,
			data;

		if (this.data.length > 0)
		{
			newData = JSON.parse(prompt('Your data: ', JSON.stringify(this.data)));

			if (newData !== null)
			{
				this.data = [];

				for (i = 0, dataLength = newData.length; i < dataLength; i++)
				{
					data = newData[ i ];

					if (data.birth !== null)
					{
						data.birth = new Date(data.birth);
					}

					if (data.death !== null)
					{
						data.death = new Date(data.death);
					}

					this.data.push(
							new Person(
								data.id,
								data.name,
								data.birth,
								data.death,
								data.father,
								data.mother
							)
						);
				}

				this.draw();
			}
		}
		else
		{
			this.showForm();
		}
	},
	getParentIndex: function (_person, _kind)
	{
		var i,
			dataLength;

		for (i = 0, dataLength = this.data.length; i < dataLength; i++)
		{
			/**
			 *  TODO:_This_need_verify!
			 */
			if (this.data[ i ].id == _person[ _kind ])
			{
				return i;
			}
		}

		return -1;
	},
	sortData: function (_a, _b)
	{
		return (_a.birth - _b.birth);
	},
	linkToParent: function (_dataIndex, _kind, _x)
	{
		var person,
			index,
			dot,
			line;

		person = this.data[ _dataIndex ];

		if (person[ _kind ] !== null)
		{
			index = this.getParentIndex(person, _kind);

			if (index >= 0)
			{
				this.highlight[ person.id ] = this.highlight[ person.id ].concat(this.highlight[ person[ _kind ] ]);

				dot = this.paper.circle(
									_x + this.linkLineSize / 2,
									index * (this.lineSeparationX + this.lineSize) + this.lineSize / 2,
									this.lineSize / 2
								);
				dot.attr('fill', this.dotAndTextColor);
				dot.attr('stroke', this.dotAndTextColor);

				line = this.paper.rect(
									_x,
									index * (this.lineSeparationX + this.lineSize) + this.lineSize,
									this.linkLineSize,
									(_dataIndex - index) * (this.lineSeparationX + this.lineSize)
								);
				line.attr('fill', this.lineColor);
				line.attr('stroke', this.lineColor);
				line.toBack();
				this.highlight[ person.id ].push(line);
			}
		}
	},
	createDelegate: function (_fn, _thisObject, _args)
	{
		return function ()
		{
			return _fn.apply(
						_thisObject || this,
						_args       || arguments
					);
		};
	},
	formatDate: function (_date)
	{
		var leftPut;

		if (!_date)
		{
			return null;
		}
		else
		{
			leftPut = function (__value)
			{
				return (__value < 10 ? '0' + __value : __value);
			};

			return _date.getFullYear() + '-' +
					leftPut((_date.getMonth() + 1)) + '-' +
						leftPut(_date.getDate());
		}
	}
};



/**
 * Person
 *
 * @param _id
 * @param _name
 * @param _birth
 * @param _death
 * @param _father
 * @param _mother
 * @constructor
 */
function Person (_id, _name, _birth, _death, _father, _mother)
{
	this.id         = _id;
	this.name       = _name;
	this.birth      = _birth;
	this.death      = _death;
	this.father     = _father;
	this.mother     = _mother;
}

/**
 * Prototype based on Person
 *
 * @type {{toString: Function}}
 */
Person.prototype = {
	toString: function ()
	{
		return this.name + ' ' +
				this.birth.getFullYear() +
					(this.death ? ' - ' + this.death.getFullYear() : '');
	}
};
/**
 *
 ********************************************/




/********************************************
 *  Load New Instance of the Family Tree Manager
 ********************************************/
$(
	function()
	{
		var familyTreeManager;

		familyTreeManager   = new FamilyTreeManager();

		familyTreeManager.init();
	}
);
/**
 *
 ********************************************/
