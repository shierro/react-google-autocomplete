import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

export default class ReactGoogleAutocomplete extends React.PureComponent {
  static propTypes = {
    onPlaceSelected: PropTypes.func,
    types: PropTypes.array,
    componentRestrictions: PropTypes.object,
    bounds: PropTypes.object,
    fields: PropTypes.array,
  };

  constructor(props) {
    super(props);
    this.autocomplete = null;
    this.event = null;
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    const {
      types = ['(cities)'],
      componentRestrictions,
      bounds,
      fields = [
        'address_components',
        'geometry.location',
        'place_id',
        'formatted_address',
      ],
    } = this.props;
    const config = {
      types,
      bounds,
      fields,
    };

    if (componentRestrictions) {
      config.componentRestrictions = componentRestrictions;
    }

    this.disableAutofill();

    this.autocomplete = new google.maps.places.Autocomplete(
      this.inputRef,
      config,
    );

    this.event = this.autocomplete.addListener(
      'place_changed',
      this.onSelected.bind(this),
    );
  }

  disableAutofill() {
    // Autofill workaround adapted from https://stackoverflow.com/questions/29931712/chrome-autofill-covers-autocomplete-for-google-maps-api-v3/49161445#49161445
    if (window.MutationObserver) {
      const observerHack = new MutationObserver(() => {
        observerHack.disconnect();
        if (this.inputRef) {
          this.inputRef.autocomplete = 'off';
        }
      });
      observerHack.observe(this.inputRef, {
        attributes: true,
        attributeFilter: ['autocomplete'],
      });
    }
  }

  componentWillUnmount() {
    this.event.remove();
  }

  onSelected() {
    if (this.props.onPlaceSelected) {
      this.props.onPlaceSelected(this.autocomplete.getPlace());
    }
  }

  render() {
    const {
      onPlaceSelected,
      types,
      componentRestrictions,
      bounds,
      textFieldProps = {},
      ...rest
    } = this.props;

    return (
      <TextField
        inputProps={rest}
        inputRef={ref => this.inputRef = ref}
        {...textFieldProps}
      />
    );
  }
}

export class ReactCustomGoogleAutocomplete extends React.PureComponent {
  static propTypes = {
    input: PropTypes.node.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.service = new google.maps.places.AutocompleteService();
  }

  onChange(e) {
    const { types = ['(cities)'] } = this.props;

    if (e.target.value) {
      this.service.getPlacePredictions(
        { input: e.target.value, types },
        (predictions, status) => {
          if (status === 'OK' && predictions && predictions.length > 0) {
            this.props.onOpen(predictions);
            console.log(predictions);
          } else {
            this.props.onClose();
          }
        },
      );
    } else {
      this.props.onClose();
    }
  }

  componentDidMount() {
    if (this.props.input.value) {
      this.placeService = new google.maps.places.PlacesService(this.refs.div);
      this.placeService.getDetails(
        { placeId: this.props.input.value },
        (e, status) => {
          if (status === 'OK') {
            this.inputRef.value = e.formatted_address;
          }
        },
      );
    }
  }

  render() {
    return (
      <div>
        {React.cloneElement(this.props.input, {
          ...this.props,
          ref: 'input',
          onChange: this.onChange,
        })}
        <div ref="div"></div>
      </div>
    );
  }
}
