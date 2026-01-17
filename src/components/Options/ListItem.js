import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FONT_FAMILY = {
  urbanistBold: 'Urbanist-Bold',
};

const ListItem = ({ title, image, icon, iconFamily = 'Ionicons', onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {image ? (
        <Image source={image} style={styles.image} />
      ) : icon ? (
        <Ionicons name={icon} size={50} color="black" style={styles.icon} />
      ) : null}
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: '#ececec',
    borderWidth: 1,
    height: 150,
    borderRadius: 30,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
    margin: 5,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 12,
    marginBottom: 15,
  },
  icon: {
    marginRight: 12,
    marginBottom: 15,
  },
  title: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.urbanistBold,
    color: 'black',
    alignSelf: 'center'
  },
});

export default ListItem;
