const { Ability, AbilityBuilder } = require('@casl/ability');

// See - https://stalniy.github.io/casl/abilities/2017/07/23/use-cases.html

// `capabilities` is an object, represents hardware capabilities, usually provided by hardware API
// `user` is an object, represents information about user details, usually provided by server API

// const capabilities = require("device-capabilities");
// function hardwarePermissions(capabilities) {
//   const { cannot, rules } = AbilityBuilder.extract();

//   if (capabilities.version < 10) {
//     cannot("manage", "Wifi").because("Device does not support Wifi");
//   }

//   return rules;
// }
function userPermissions(event, context) {
  const { can, rules } = AbilityBuilder.extract();

  // if (user.role === "admin") {
  //   can("manage", "all");
  // } else {
  //   can("read", "all");
  // }
  can('read', 'all');

  return rules;
}

let _ability = null;

const initPermissions = (event, context) => {
  // const rules = userPermissions(user).concat(hardwarePermissions(capabilities));
  const rules = userPermissions(event, context);
  _ability = new Ability(rules);
};
const getAbility = () => {
  return _ability;
};
export { getAbility, initPermissions };

// Check permission as follows
// import {getAbility} from '../libs/permissions'
// if getAbility().can("manage", "Wifi");
//
// Initialize in your handler as
// import {initPermissions} from '../libs/permission'
// initPermissions(event,context);
// Modify the code above to set the permissions.
